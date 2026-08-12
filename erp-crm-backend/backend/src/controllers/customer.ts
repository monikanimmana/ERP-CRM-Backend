import { Request, Response, NextFunction } from "express";
import * as customerService from "../services/customer";
import * as customerValidator from "../validators/customer";
import { ValidationError } from "../utils/errors";

function flattenZodErrors(issues: any[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.join(".");
    fields[path] = issue.message;
  }
  return fields;
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = customerValidator.createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const customer = await customerService.createCustomer(parsed.data);
    res.status(201).json({ data: customer });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const result = await customerService.getCustomers(req.query, userId, userRole);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.status(200).json({ data: customer });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = customerValidator.updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const customer = await customerService.updateCustomer(req.params.id, parsed.data);
    res.status(200).json({ data: customer });
  } catch (err) {
    next(err);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = customerValidator.addNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const note = await customerService.addCustomerNote(req.params.id, parsed.data, req.user!.userId);
    res.status(201).json({ data: note });
  } catch (err) {
    next(err);
  }
}
