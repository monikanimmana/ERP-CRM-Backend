import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  currentStock: z.coerce.number().int().nonnegative("Stock must be non-negative").default(0),
  minStockAlert: z.coerce.number().int().nonnegative("Min stock alert must be non-negative").default(10),
  warehouseLocation: z.string().min(1, "Warehouse location is required"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;

export const stockAdjustSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required"),
});

export type StockAdjustRequest = z.infer<typeof stockAdjustSchema>;
