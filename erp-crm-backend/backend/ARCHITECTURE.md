# Architecture & Design Decisions

## Overview

This is a production-ready Node.js/TypeScript backend for a mini ERP + CRM system. It follows a clean, layered architecture with strict separation of concerns: routes → controllers → services → data layer (Prisma).

## Layered Architecture

### `/src/config` — Configuration & Setup

- `env.ts` — Environment variable loading with validation
- `prisma.ts` — Single shared Prisma Client instance

**Why:** Centralized config ensures single source of truth and prevents multiple Prisma instances from exhausting connection pools.

### `/src/middlewares` — HTTP Middleware

- `authenticate.ts` — JWT verification, populates `req.user` with `{ userId, role }`
- `authorize.ts` — Role-based access control middleware factory
- `errorHandler.ts` — Centralized error handling; catches all errors and transforms to consistent response shape

**Why:** Middleware stack ensures authentication/authorization run on every request before routing. Centralized error handler prevents scattered try/catch blocks and ensures consistent error responses.

### `/src/validators` — Request Validation

- `auth.ts`, `customer.ts`, `product.ts`, `challan.ts` — Zod schemas per resource

**Why:** Validation at the boundary ensures no invalid data enters the application. Zod provides type-safe parsing and field-level error messages.

### `/src/utils` — Shared Utilities

- `errors.ts` — Typed error classes (AppError, NotFoundError, ValidationError, InsufficientStockError)
- `pagination.ts` — Pagination helper for consistent list responses
- `challanNumber.ts` — Sequential challan number generation (CH-YYYY-NNNN)

**Why:** Utilities avoid duplication and are single-location sources for cross-cutting concerns.

### `/src/services` — Business Logic

- `auth.ts` — User registration, login, JWT issuance, password hashing
- `customer.ts` — Customer CRUD, notes, search/filter/pagination
- `product.ts` — Product CRUD, stock log, atomic stock adjust
- `challan.ts` — Challan CRUD, confirm (with stock validation), cancel (with stock reversal)

**Why:** All business logic lives here. Services are Prisma-aware but have no knowledge of HTTP. Testable and reusable.

**Transaction Pattern:** Multi-step operations (stock adjust, challan confirm, challan cancel) use Prisma `$transaction()` for atomicity. This prevents race conditions and ensures data integrity.

### `/src/controllers` — Request Handlers

- `auth.ts`, `customer.ts`, `product.ts`, `challan.ts` — One controller per resource

**Controllers:**

1. Parse request body with Zod (validation)
2. If validation fails, throw `ValidationError` (caught by error middleware)
3. Call service method
4. Shape response for HTTP
5. Let errors bubble to error middleware

**Why:** Thin layer — no business logic here. Separates HTTP concerns from domain logic.

### `/src/routes` — Route Definitions

- `auth.ts`, `customer.ts`, `product.ts`, `challan.ts` — Express Router per resource

**Each route file:**

1. Creates Router instance
2. Attaches middleware (authenticate, authorize)
3. Wires endpoints to controllers
4. Uses `asyncHandler` to catch promise rejections

**Why:** Routes are wiring diagrams. All access control (authorization) is declared here for easy auditing.

### `/src/index.ts` — Application Entry Point

1. Express app setup
2. Global middleware stack (body parsing, CORS, logging)
3. Route registration
4. Error handler (must be last)
5. Server startup

## Key Design Decisions

### 1. Transaction-Level Stock Integrity

**Decision:** Stock never goes negative. Enforced at transaction level, not just application logic.

**Implementation:**

- All stock-affecting operations run inside `prisma.$transaction()`
- Stock validation happens **before** any updates
- If validation fails, entire transaction rolls back
- Example: Challan confirm checks all items' stock, then deducts all or none

**Benefit:** Survives concurrent requests. Two simultaneous requests for the same product can't both pass validation.

### 2. Challan Number Generation

**Decision:** Auto-generated sequential numbers per year (CH-2026-0001, CH-2026-0002, …)

**Implementation:**

- Generated inside transaction during challan creation
- Finds highest existing number for year, increments
- Unique constraint on `challan.challanNumber` ensures no collisions

**Benefit:** Sequential IDs are more readable than UUIDs and allow for business logic based on year/number.

### 3. Snapshot Pattern for Challan Items

**Decision:** Store product snapshot (name, SKU, price) at challan creation time, never re-derive from live Product data.

**Implementation:**

- ChallanItem has `productNameSnapshot`, `productSkuSnapshot`, `unitPriceSnapshot`
- Populated at creation from current Product data
- Product later changes do NOT affect existing challans

**Benefit:** Challan reflects business state at time of creation, not at time of viewing. Supports historical accuracy.

### 4. JWT with Role Payload

**Decision:** JWT contains `{ userId, role }` — no need to fetch user from DB on every request.

**Implementation:**

- Login creates JWT with both fields
- authenticate middleware decodes and populates `req.user`
- Controllers use `req.user.role` for role checks and `req.user.userId` for audit trails

**Benefit:** Fast, stateless; DB only hit for auth/data operations, not auth validation.

### 5. Centralized Error Handling

**Decision:** All errors throw AppError or subclasses. Caught by centralized middleware. No scattered try/catch.

**Pattern:**

```typescript
// Service throws
if (!user) throw new NotFoundError("User", id);

// Controller doesn't catch
const user = await userService.get(id);

// Error middleware catches
app.use(errorHandler);
```

**Benefit:** Consistent error responses. Easy to add logging, metrics, or custom error mapping in one place.

### 6. Role-Based Access Control (RBAC)

**Decision:** authorize(roles) middleware declared at route level.

**Roles:**

- **ADMIN** — Full system access
- **SALES** — Create/manage customers and challans
- **WAREHOUSE** — Manage products and stock
- **ACCOUNTS** — View-only access (can read all, modify none)

**Access Matrix:**

| Operation | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|-----------|-------|-------|-----------|----------|
| Create Customer | ✓ | ✓ | ✗ | ✗ |
| Create Product | ✓ | ✗ | ✓ | ✗ |
| Stock Adjust | ✓ | ✗ | ✓ | ✗ |
| Create Challan | ✓ | ✓ | ✗ | ✗ |
| View All | ✓ | ✓ | ✓ | ✓ |

**Benefit:** Authorization policy is explicit and auditable.

### 7. Atomic Stock Deduction on Challan Confirm

**Decision:** When confirming a challan, stock check → deduction happens atomically.

**Flow:**

```
Transaction starts
  ├─ Read current stock for each item
  ├─ Validate all items have sufficient stock
  │  If any short: throw error, rollback
  ├─ Deduct stock for each item
  ├─ Create StockMovement (OUT) for each item
  └─ Update challan status to CONFIRMED
Transaction commits
```

**Benefit:** No partial updates. If confirmation fails, no stock is touched.

### 8. Pagination with Offset

**Decision:** Offset-based pagination (`page`, `limit`) — simple, sufficient for small/medium datasets.

**Response Shape:**

```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 543
}
```

**Benefit:** Frontend can calculate total pages, skip values, and cursor positions easily. Works with sorted lists.

**Note:** For very large datasets (millions of records), consider cursor-based pagination or external search (Elasticsearch).

### 9. Validation at Boundary with Field-Level Errors

**Decision:** Zod validates at controller boundary. Validation errors include field-level messages.

**Example:**

```json
{
  "error": "validation_error",
  "details": {
    "fields": {
      "email": "Invalid email address",
      "password": "Password must be at least 6 characters"
    }
  }
}
```

**Benefit:** Frontend maps errors directly to form fields. No generic "validation failed" messages.

## Data Flow Example: Confirm Challan

**Request:**

```
PUT /challans/{id}/confirm
Authorization: Bearer <JWT>
```

**Flow:**

1. Express parses request
2. `authenticate` middleware verifies JWT, sets `req.user`
3. Router reaches `authorize(["SALES", "ADMIN"])`
4. If unauthorized, middleware throws ForbiddenError
5. Controller receives request
6. Controller calls `challanService.confirmChallan(id, userId)`
7. Service:
   - Fetches challan
   - Validates status is DRAFT
   - Starts transaction
   - Checks all items' stock
   - If any shortage, throws InsufficientStockError (rolled back)
   - Deducts stock, creates movements
   - Updates challan status
8. Controller shapes response
9. Response or error reaches error middleware
10. Error middleware formats response and sends to client

## Testing Strategy (Not Implemented)

In a real project, add Jest tests for:

- **Unit:** Services (business logic)
- **Integration:** Database operations (Prisma queries)
- **E2E:** HTTP routes with real DB (docker-compose for ephemeral DB)

Example test structure:

```typescript
describe("ChallanService", () => {
  describe("confirmChallan", () => {
    it("should deduct stock atomically", async () => {
      // arrange
      const challan = await createTestChallan();
      
      // act
      await challanService.confirmChallan(challan.id, userId);
      
      // assert
      const updated = await prisma.challan.findUnique({ where: { id: challan.id } });
      expect(updated.status).toBe("CONFIRMED");
      
      const product = await prisma.product.findUnique({ where: { id: productId } });
      expect(product.currentStock).toBe(initialStock - quantity);
    });
  });
});
```

## Performance Considerations

1. **Database Indexes:** Add indexes on frequently filtered/searched columns (SKU, customer status, challan status)
2. **Connection Pool:** Prisma default is 10. Tune based on concurrency.
3. **Pagination Limit:** Max 100 per request prevents memory spikes.
4. **JWT Expiry:** 7 days default. Consider shorter for high-security scenarios.
5. **CORS:** Configured to accept localhost during development. Restrict origin in production.

## Security Considerations

1. **Password Hashing:** bcrypt with 10 rounds (default). Increase to 12+ in production if CPU allows.
2. **JWT Secret:** Must be ≥32 random characters in production. Use `openssl rand -base64 32`.
3. **HTTPS Only:** In production, set secure cookies and require HTTPS.
4. **Rate Limiting:** Not implemented. Add express-rate-limit for login endpoint.
5. **SQL Injection:** Prevented by Prisma parameterized queries.
6. **CSRF:** Not needed — stateless JWT auth.
7. **Request Validation:** Zod + TypeScript catch most injection attempts at boundary.

## Extensibility

### Adding a New Resource (e.g., Invoice)

1. Create `src/validators/invoice.ts` — Zod schemas
2. Create `src/services/invoice.ts` — Business logic
3. Create `src/controllers/invoice.ts` — HTTP handlers
4. Create `src/routes/invoice.ts` — Route definitions
5. Register routes in `src/index.ts`
6. Add Prisma models in `schema.prisma`
7. Run `npm run db:migrate`

### Adding Custom Business Logic

Example: Calculate customer credit limit based on total orders.

```typescript
// src/services/customer.ts
export async function getCustomerCreditLimit(customerId: string) {
  const totalOrders = await prisma.challan.aggregate({
    where: { customerId, status: "CONFIRMED" },
    _sum: { totalQuantity: true },
  });
  // Apply business rule
  return totalOrders._sum.totalQuantity * unitPriceAvg * creditMultiplier;
}
```

## Summary

This architecture provides:

- ✅ Clear separation of concerns (routes → controllers → services → data)
- ✅ Type safety (TypeScript + Zod)
- ✅ Atomic operations (Prisma transactions)
- ✅ Consistent error handling
- ✅ Role-based access control
- ✅ Field-level validation errors
- ✅ Scalable to hundreds of endpoints
- ✅ Easy to test and extend

The codebase is built for a React + TypeScript + React Query frontend and provides predictable, well-typed API contracts.
