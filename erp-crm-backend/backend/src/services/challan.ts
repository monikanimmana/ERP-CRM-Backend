import prisma from "../config/prisma";
import { NotFoundError, ConflictError, InsufficientStockError } from "../utils/errors";
import { CreateChallanRequest } from "../validators/challan";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { generateChallanNumber } from "../utils/challanNumber";
import { Decimal } from "@prisma/client/runtime/library";

export async function createChallan(req: CreateChallanRequest, userId: string) {
  // Verify customer exists
  const customer = await prisma.customer.findUnique({ where: { id: req.customerId } });
  if (!customer) throw new NotFoundError("Customer", req.customerId);

  // Run inside transaction for atomicity
  return prisma.$transaction(async (tx) => {
    // Generate challan number
    const challanNumber = await generateChallanNumber(tx);

    // Fetch all products to validate and snapshot
    const productIds = req.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const shortages: Array<{ productId: string; productName: string; requested: number; available: number }> = [];

    // Validate stock if CONFIRMED
    if (req.status === "CONFIRMED") {
      for (const item of req.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new NotFoundError("Product", item.productId);
        if (product.currentStock < item.quantity) {
          shortages.push({
            productId: product.id,
            productName: product.name,
            requested: item.quantity,
            available: product.currentStock,
          });
        }
      }

      if (shortages.length > 0) {
        throw new InsufficientStockError(shortages);
      }
    }

    // Create challan with items
    const totalQuantity = req.items.reduce((sum, item) => sum + item.quantity, 0);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: req.customerId,
        status: req.status,
        totalQuantity,
        createdBy: userId,
        items: {
          create: req.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    // If CONFIRMED, deduct stock and create movements
    if (req.status === "CONFIRMED") {
      for (const item of req.items) {
        const product = productMap.get(item.productId)!;

        // Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: product.currentStock - item.quantity },
        });

        // Record movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: "OUT",
            reason: `Challan ${challanNumber}`,
            createdBy: userId,
          },
        });
      }
    }

    return challan;
  });
}

export async function getChallans(query: Record<string, unknown>, userId?: string, userRole?: string) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as string | undefined;
  const customerId = query.customerId as string | undefined;
  const startDate = query.startDate as string | undefined;
  const endDate = query.endDate as string | undefined;

  const where: any = {};
  
  // Only SALES see their own challans. ADMIN and MANAGER see all
  if (userId && userRole === "SALES") {
    where.createdBy = userId;
  }
  
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      include: { items: true, customer: { select: { name: true, businessName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.challan.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!challan) throw new NotFoundError("Challan", id);
  return challan;
}

/**
 * Confirm a draft challan — same stock-check-and-deduct logic as create with CONFIRMED status.
 */
export async function confirmChallan(id: string, userId: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!challan) throw new NotFoundError("Challan", id);

  if (challan.status !== "DRAFT") {
    throw new ConflictError(`Cannot confirm challan with status '${challan.status}'`);
  }

  // Run inside transaction
  return prisma.$transaction(async (tx) => {
    // Fetch current stock for all products in challan
    const productIds = challan.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const shortages: Array<{ productId: string; productName: string; requested: number; available: number }> = [];

    // Check stock
    for (const item of challan.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError("Product", item.productId);
      if (product.currentStock < item.quantity) {
        shortages.push({
          productId: product.id,
          productName: product.name,
          requested: item.quantity,
          available: product.currentStock,
        });
      }
    }

    if (shortages.length > 0) {
      throw new InsufficientStockError(shortages);
    }

    // Deduct stock and record movements
    for (const item of challan.items) {
      const product = productMap.get(item.productId)!;

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: product.currentStock - item.quantity },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantityChanged: item.quantity,
          movementType: "OUT",
          reason: `Challan ${challan.challanNumber}`,
          createdBy: userId,
        },
      });
    }

    // Update challan status
    const updated = await tx.challan.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: { items: true },
    });

    return updated;
  });
}

/**
 * Cancel a challan — if CONFIRMED, restore stock via reverse movements.
 */
export async function cancelChallan(id: string, userId: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!challan) throw new NotFoundError("Challan", id);

  if (challan.status === "CANCELLED") {
    throw new ConflictError("Challan is already cancelled");
  }

  // Run inside transaction
  return prisma.$transaction(async (tx) => {
    // If CONFIRMED, restore stock
    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundError("Product", item.productId);

        // Restore stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: product.currentStock + item.quantity },
        });

        // Record reverse movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: "IN",
            reason: `Challan ${challan.challanNumber} cancelled`,
            createdBy: userId,
          },
        });
      }
    }

    // Update challan status
    const updated = await tx.challan.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: true },
    });

    return updated;
  });
}
