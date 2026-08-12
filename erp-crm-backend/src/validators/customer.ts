import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  businessName: z.string().min(1, "Business name is required"),
  gstNumber: z.string().optional().or(z.literal("")),
  customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).default("RETAIL"),
  address: z.string().min(1, "Address is required"),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
  followUpDate: z.string().datetime().optional().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerRequest = z.infer<typeof updateCustomerSchema>;

export const addNoteSchema = z.object({
  note: z.string().min(1, "Note is required"),
});

export type AddNoteRequest = z.infer<typeof addNoteSchema>;
