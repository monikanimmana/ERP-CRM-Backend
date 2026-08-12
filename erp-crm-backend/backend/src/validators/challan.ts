import { z } from "zod";

export const createChallanSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      quantity: z.coerce.number().int().positive("Quantity must be positive"),
    })
  ).min(1, "At least one item is required"),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
});

export type CreateChallanRequest = z.infer<typeof createChallanSchema>;
