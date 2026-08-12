import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth";
import * as authValidator from "../validators/auth";
import { ValidationError } from "../utils/errors";

function flattenZodErrors(issues: any[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.join(".");
    fields[path] = issue.message;
  }
  return fields;
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = authValidator.registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const user = await authService.register(parsed.data);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = authValidator.loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const result = await authService.login(parsed.data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
