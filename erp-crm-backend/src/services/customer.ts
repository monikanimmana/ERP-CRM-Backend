import prisma from "../config/prisma";
import { NotFoundError, ConflictError } from "../utils/errors";
import { CreateCustomerRequest, UpdateCustomerRequest, AddNoteRequest } from "../validators/customer";
import { parsePagination, paginatedResponse } from "../utils/pagination";

export async function createCustomer(data: CreateCustomerRequest) {
  return prisma.customer.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      businessName: data.businessName,
      gstNumber: data.gstNumber || null,
      customerType: data.customerType,
      address: data.address,
      status: data.status,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
    include: { notes: true },
  });
}

export async function getCustomers(query: Record<string, unknown>, userId?: string, userRole?: string) {
  const { page, limit, skip } = parsePagination(query);
  const search = (query.search as string) || "";
  const status = query.status as string | undefined;
  const customerType = query.customerType as string | undefined;

  const where: any = {};
  
  // Non-admin users see only their own data (created by them)
  if (userId && userRole !== "ADMIN") {
    // For now, we'll show all customers to SALES/WAREHOUSE/ACCOUNTS
    // If you want user-specific filtering, add a createdBy field to Customer model
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (customerType) where.customerType = customerType;

  const [data, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: limit, include: { notes: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });
  if (!customer) throw new NotFoundError("Customer", id);
  return customer;
}

export async function updateCustomer(id: string, data: UpdateCustomerRequest) {
  // Verify exists
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Customer", id);

  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      businessName: data.businessName,
      gstNumber: data.gstNumber || null,
      customerType: data.customerType,
      address: data.address,
      status: data.status,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
    include: { notes: true },
  });
}

export async function addCustomerNote(customerId: string, req: AddNoteRequest, userId: string) {
  // Verify customer exists
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new NotFoundError("Customer", customerId);

  return prisma.customerNote.create({
    data: {
      customerId,
      note: req.note,
      createdBy: userId,
    },
  });
}
