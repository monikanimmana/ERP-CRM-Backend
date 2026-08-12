/**
 * Typed application errors — thrown from services, caught by the centralized error handler.
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, "not_found", id ? `${resource} with id '${id}' not found` : `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, "conflict", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "forbidden", message);
  }
}

export class ValidationError extends AppError {
  constructor(fields: Record<string, string>) {
    super(400, "validation_error", "Validation failed", { fields });
  }
}

export class InsufficientStockError extends AppError {
  constructor(details: Array<{ productId: string; productName: string; requested: number; available: number }>) {
    super(400, "insufficient_stock", "One or more products have insufficient stock", { details });
  }
}
