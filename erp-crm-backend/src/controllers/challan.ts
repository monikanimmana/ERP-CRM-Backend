import { Request, Response, NextFunction } from "express";
import * as challanService from "../services/challan";
import * as challanValidator from "../validators/challan";
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
    const parsed = challanValidator.createChallanSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(flattenZodErrors(parsed.error.issues)));
    }

    const challan = await challanService.createChallan(parsed.data, req.user!.userId);
    res.status(201).json({ data: challan });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const result = await challanService.getChallans(req.query, userId, userRole);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challan = await challanService.getChallanById(req.params.id);
    res.status(200).json({ data: challan });
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challan = await challanService.confirmChallan(req.params.id, req.user!.userId);
    res.status(200).json({ data: challan });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challan = await challanService.cancelChallan(req.params.id, req.user!.userId);
    res.status(200).json({ data: challan });
  } catch (err) {
    next(err);
  }
}
