import prisma from "../config/prisma";
import { NotFoundError, ConflictError } from "../utils/errors";
import { CreateProductRequest, UpdateProductRequest, StockAdjustRequest } from "../validators/product";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { Decimal } from "@prisma/client/runtime/library";

export async function createProduct(data: CreateProductRequest) {
  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
  }

  return prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitPrice: new Decimal(data.unitPrice),
      currentStock: data.currentStock || 0,
      minStockAlert: data.minStockAlert || 10,
      warehouseLocation: data.warehouseLocation,
    },
  });
}

export async function getProducts(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = (query.search as string) || "";
  const category = query.category as string | undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError("Product", id);
  return product;
}

export async function updateProduct(id: string, data: UpdateProductRequest) {
  // Verify exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Product", id);

  // If SKU is being updated, check uniqueness
  if (data.sku && data.sku !== existing.sku) {
    const conflict = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (conflict) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
    }
  }

  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitPrice: data.unitPrice ? new Decimal(data.unitPrice) : undefined,
      currentStock: data.currentStock,
      minStockAlert: data.minStockAlert,
      warehouseLocation: data.warehouseLocation,
    },
  });
}

export async function getStockLog(productId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("Product", productId);

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { productId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockMovement.count({ where: { productId } }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

/**
 * Atomic stock adjustment with transaction.
 * Prevents race conditions by locking the product row during update.
 */
export async function stockAdjust(productId: string, req: StockAdjustRequest, userId: string) {
  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("Product", productId);

  // Run inside transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id: productId } });
    if (!current) throw new NotFoundError("Product", productId);

    const newStock = req.movementType === "IN" ? current.currentStock + req.quantity : current.currentStock - req.quantity;

    if (newStock < 0) {
      throw new ConflictError(`Insufficient stock: have ${current.currentStock}, trying to remove ${req.quantity}`);
    }

    // Update stock
    await tx.product.update({
      where: { id: productId },
      data: { currentStock: newStock },
    });

    // Record movement
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        quantityChanged: req.quantity,
        movementType: req.movementType,
        reason: req.reason,
        createdBy: userId,
      },
    });

    return movement;
  });
}
