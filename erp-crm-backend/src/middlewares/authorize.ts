import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

/**
 * Role-based access control middleware.
 * Usage: authorize(["ADMIN", "SALES"])
 */
export function authorize(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not allowed to access this resource`));
    }
    next();
  };
}
