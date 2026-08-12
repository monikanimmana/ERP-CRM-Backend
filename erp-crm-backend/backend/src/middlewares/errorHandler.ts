import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Centralized error-handling middleware.
 * Catches all errors, transforms them to consistent response shape, and sends to client.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("Error:", err);

  if (err instanceof AppError) {
    const body: any = {
      error: err.code,
      message: err.message,
    };
    if (err.details) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  // Fallback for unhandled errors
  res.status(500).json({
    error: "internal_server_error",
    message: "An unexpected error occurred",
  });
}

/**
 * Async error wrapper — catches promise rejections in route handlers.
 * Usage: router.get("/path", asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
