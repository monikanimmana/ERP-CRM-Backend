# Quick Reference Card

## Setup (Copy-Paste)

```bash
# 1. Database
createdb erp_crm_db

# 2. Install
npm install

# 3. Migrate & Seed
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
```

Server: `http://localhost:4000`

---

## Test Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@erp.local","password":"sales123"}'
```

Copy the `token` value for other requests.

---

## Test List Customers

```bash
curl -X GET http://localhost:4000/customers?page=1&limit=20 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## All Endpoints (25+)

### Auth (2)

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/auth/login` | ✗ | email, password |
| POST | `/auth/register` | ✓ (ADMIN) | name, email, password, role |

### Customers (5)

| Method | Endpoint | Auth | Query |
|--------|----------|------|-------|
| POST | `/customers` | ✓ (SALES) | — |
| GET | `/customers` | ✓ | page, limit, search, status, customerType |
| GET | `/customers/:id` | ✓ | — |
| PUT | `/customers/:id` | ✓ (SALES) | — |
| POST | `/customers/:id/notes` | ✓ (SALES) | — |

### Products (6)

| Method | Endpoint | Auth | Query |
|--------|----------|------|-------|
| POST | `/products` | ✓ (WAREHOUSE) | — |
| GET | `/products` | ✓ | page, limit, search, category |
| GET | `/products/:id` | ✓ | — |
| PUT | `/products/:id` | ✓ (WAREHOUSE) | — |
| GET | `/products/:id/stock-log` | ✓ | page, limit |
| POST | `/products/:id/stock-adjust` | ✓ (WAREHOUSE) | — |

### Challans (5)

| Method | Endpoint | Auth | Query |
|--------|----------|------|-------|
| POST | `/challans` | ✓ (SALES) | — |
| GET | `/challans` | ✓ | page, limit, status, customerId, startDate, endDate |
| GET | `/challans/:id` | ✓ | — |
| PUT | `/challans/:id/confirm` | ✓ (SALES) | — |
| PUT | `/challans/:id/cancel` | ✓ (SALES) | — |

### Health (1)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/health` | ✗ |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success, read operation |
| 201 | Success, resource created |
| 400 | Bad request (validation/logic error) |
| 401 | Unauthorized (invalid/missing JWT) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 409 | Conflict (business rule violation) |
| 500 | Server error |

---

## Response Shapes

### Success (Single Resource)

```json
{
  "data": { /* resource */ }
}
```

### Success (List)

```json
{
  "data": [ /* items */ ],
  "page": 1,
  "limit": 20,
  "total": 543
}
```

### Error

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": { /* optional context */ }
}
```

---

## Query Parameters

### Pagination

- `page=1` (default 1)
- `limit=20` (default 20, max 100)

### Search

- `search=<string>` — Full-text search on relevant fields

### Filters

**Customers:**

- `status=LEAD|ACTIVE|INACTIVE`
- `customerType=RETAIL|WHOLESALE|DISTRIBUTOR`

**Products:**

- `category=<string>`

**Challans:**

- `status=DRAFT|CONFIRMED|CANCELLED`
- `customerId=<id>`
- `startDate=<ISO datetime>`
- `endDate=<ISO datetime>`

---

## Common Payloads

### Create Customer

```json
{
  "name": "ABC Store",
  "mobile": "9876543210",
  "email": "abc@store.com",
  "businessName": "ABC Store Ltd",
  "gstNumber": "27AABCU1234H1Z0",
  "customerType": "RETAIL",
  "address": "123 Main St",
  "status": "LEAD",
  "followUpDate": "2026-08-20T10:00:00Z"
}
```

### Create Product

```json
{
  "name": "Industrial Bearing",
  "sku": "SKU-001",
  "category": "Bearings",
  "unitPrice": 1500,
  "currentStock": 50,
  "minStockAlert": 10,
  "warehouseLocation": "Rack A1"
}
```

### Create Challan (DRAFT)

```json
{
  "customerId": "cust-123",
  "items": [
    { "productId": "prod-123", "quantity": 5 },
    { "productId": "prod-456", "quantity": 10 }
  ],
  "status": "DRAFT"
}
```

### Create Challan (CONFIRMED)

```json
{
  "customerId": "cust-123",
  "items": [
    { "productId": "prod-123", "quantity": 5 }
  ],
  "status": "CONFIRMED"
}
```

### Stock Adjust (IN)

```json
{
  "quantity": 25,
  "movementType": "IN",
  "reason": "Purchase order PO-001"
}
```

### Stock Adjust (OUT)

```json
{
  "quantity": 5,
  "movementType": "OUT",
  "reason": "Damage write-off"
}
```

### Add Customer Note

```json
{
  "note": "Called today, prefers Mondays"
}
```

---

## Roles & Permissions

| Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|--------|-------|-------|-----------|----------|
| Create Customer | ✓ | ✓ | ✗ | ✗ |
| List Customers | ✓ | ✓ | ✓ | ✓ |
| Update Customer | ✓ | ✓ | ✗ | ✗ |
| Add Customer Note | ✓ | ✓ | ✗ | ✗ |
| Create Product | ✓ | ✗ | ✓ | ✗ |
| List Products | ✓ | ✓ | ✓ | ✓ |
| Update Product | ✓ | ✗ | ✓ | ✗ |
| Adjust Stock | ✓ | ✗ | ✓ | ✗ |
| Create Challan | ✓ | ✓ | ✗ | ✗ |
| Confirm Challan | ✓ | ✓ | ✗ | ✗ |
| Cancel Challan | ✓ | ✓ | ✗ | ✗ |
| List Challans | ✓ | ✓ | ✓ | ✓ |
| Register User | ✓ | ✗ | ✗ | ✗ |

---

## Key Business Rules

1. **Stock Never Goes Negative** — Enforced at DB level
2. **Challan Number Auto-Increment** — Format: CH-YYYY-NNNN
3. **Snapshot on Challan** — Product name/SKU/price frozen at creation
4. **Confirm = Deduct** — Stock deducted when status changes to CONFIRMED
5. **Cancel = Restore** — If CONFIRMED, stock is restored
6. **Atomic Operations** — Multi-step operations use transactions (all or nothing)
7. **Unique SKU** — Products must have unique SKUs
8. **Unique Email** — Users must have unique emails

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running — start it |
| `database "erp_crm_db" does not exist` | `createdb erp_crm_db` |
| `relation "users" does not exist` | `npm run db:migrate` |
| `Missing DATABASE_URL` | Add to `.env` |
| `Invalid JWT` | Re-login to get new token |
| `Insufficient stock` | Check product's currentStock |
| `Port 4000 already in use` | Change PORT in `.env` |

---

## Files to Know

| File | Purpose |
|------|---------|
| `src/index.ts` | Express app entry point |
| `src/services/*.ts` | Business logic |
| `src/controllers/*.ts` | HTTP handlers |
| `src/routes/*.ts` | Route definitions |
| `src/middlewares/*.ts` | Auth, errors |
| `prisma/schema.prisma` | Database models |
| `prisma/seed.ts` | Test data |
| `package.json` | Scripts & dependencies |
| `README.md` | Full docs |
| `api.http` | REST client file |

---

## Scripts

```bash
npm run dev              # Development server
npm run build           # Compile TypeScript
npm start               # Run compiled code
npm run db:migrate      # Apply migrations
npm run db:seed         # Populate test data
npm run db:studio       # Prisma Studio UI
npm run db:reset        # Reset DB (careful!)
```

---

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/erp_crm_db?schema=public"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
```

---

## Frontend Integration Checklist

- ✓ All endpoints implement consistent pagination
- ✓ All errors return status code + error code + message + field details
- ✓ JWT in `Authorization: Bearer <token>` header
- ✓ Insufficient stock errors include per-item details for UI rendering
- ✓ Validation errors map to form fields
- ✓ Role-based access enforced server-side

Ready to build your React frontend! 🚀
