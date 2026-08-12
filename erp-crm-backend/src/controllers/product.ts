import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product";
import * as productValidator from "../validators/product";
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
    const parsed = productValidator.createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const product = await productService.createProduct(parsed.data);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productService.getProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = productValidator.updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const product = await productService.updateProduct(req.params.id, parsed.data);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function getStockLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productService.getStockLog(req.params.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function stockAdjust(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = productValidator.stockAdjustSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const movement = await productService.stockAdjust(req.params.id, parsed.data, req.user!.userId);
    res.status(201).json({ data: movement });
  } catch (err) {
    next(err);
  }
}
