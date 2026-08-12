# 🔐 ROLE-BASED ACCESS CONTROL (RBAC) — CORRECT IMPLEMENTATION

**Status:** Implementation Guide with Required Fixes  
**Date:** August 12, 2026  

---

## ⚠️ CURRENT ISSUES FOUND

### Issue 1: MANAGER Role Should Not Exist
- **Problem:** Routes reference "MANAGER" role, but spec only has 4 roles
- **Fix:** Remove all "MANAGER" references, update to ADMIN/SALES/WAREHOUSE/ACCOUNTS only

### Issue 2: Challan Confirm Has Wrong Authorization
- **Problem:** Current code allows SALES to confirm (wrong!)
- **Spec:** Only WAREHOUSE can confirm (triggers stock deduction)
- **Fix:** Change `/challans/:id/confirm` to `authorize(["WAREHOUSE", "ADMIN"])` only

### Issue 3: ACCOUNTS Should Be Read-Only
- **Problem:** No explicit restriction - needs to be enforced
- **Fix:** Ensure ACCOUNTS cannot POST/PUT/DELETE, only GET

### Issue 4: Product Creation Should Be ADMIN + Warehouse
- **Problem:** Too permissive
- **Fix:** Only ADMIN can create products; WAREHOUSE can only adjust stock

---

## 📋 CORRECT ROLE MATRIX

### User Management
```
Action                    | ADMIN | SALES | WAREHOUSE | ACCOUNTS
Create/Edit/Delete users  | ✅    | ❌    | ❌        | ❌
View user list            | ✅    | ❌    | ❌        | ❌
```

### Customer Management
```
Action                    | ADMIN | SALES | WAREHOUSE | ACCOUNTS
Create customer           | ✅    | ✅    | ❌        | ❌
Edit customer             | ✅    | ✅    | ❌        | ❌
View all customers        | ✅    | ✅    | ✅ (view) | ✅ (view)
Add follow-up notes       | ✅    | ✅    | ❌        | ❌
```

### Product Management
```
Action                    | ADMIN | SALES | WAREHOUSE | ACCOUNTS
Create product            | ✅    | ❌    | ❌        | ❌
Edit product              | ✅    | ❌    | ❌        | ❌
View all products         | ✅    | ✅    | ✅        | ✅
```

### Stock Management
```
Action                    | ADMIN | SALES | WAREHOUSE | ACCOUNTS
Adjust stock (IN/OUT)     | ✅    | ❌    | ✅        | ❌
View stock/history        | ✅    | ✅    | ✅        | ✅
```

### Challan Management
```
Action                    | ADMIN | SALES | WAREHOUSE | ACCOUNTS
Create challan (DRAFT)    | ✅    | ✅    | ❌        | ❌
Edit own draft            | ✅    | ✅    | ❌        | ❌
Confirm challan (deduct)  | ✅    | ❌    | ✅        | ❌
Cancel challan            | ✅    | ✅    | ✅        | ❌
View all challans         | ✅    | ✅    | ✅        | ✅
```

---

## 🔧 CODE CHANGES REQUIRED

### File 1: `src/routes/auth.ts` ✅ CORRECT (No Changes)
```typescript
// ✅ Already correct
router.post("/login", asyncHandler(authController.login));
router.post("/register", authenticate, authorize(["ADMIN"]), asyncHandler(authController.register));
```

### File 2: `src/routes/customer.ts` - NEEDS FIX

**Current (WRONG):**
```typescript
router.post("/", authorize(["SALES", "MANAGER", "ADMIN"]), ...);
router.put("/:id", authorize(["SALES", "MANAGER", "ADMIN"]), ...);
router.post("/:id/notes", authorize(["SALES", "MANAGER", "ADMIN"]), ...);
```

**Should Be (CORRECT):**
```typescript
// POST /customers — ADMIN and SALES can create
router.post("/", authorize(["ADMIN", "SALES"]), asyncHandler(customerController.create));

// GET /customers — all authenticated users can VIEW (read-only)
router.get("/", asyncHandler(customerController.list));

// GET /customers/:id — all can view
router.get("/:id", asyncHandler(customerController.getById));

// PUT /customers/:id — ADMIN and SALES can edit
router.put("/:id", authorize(["ADMIN", "SALES"]), asyncHandler(customerController.update));

// POST /customers/:id/notes — ADMIN and SALES can add notes
router.post("/:id/notes", authorize(["ADMIN", "SALES"]), asyncHandler(customerController.addNote));
```

### File 3: `src/routes/product.ts` - NEEDS FIX

**Current (WRONG):**
```typescript
router.post("/", authorize(["ADMIN", "MANAGER", "WAREHOUSE"]), ...);
router.put("/:id", authorize(["ADMIN", "MANAGER", "WAREHOUSE"]), ...);
```

**Should Be (CORRECT):**
```typescript
// POST /products — only ADMIN can create
router.post("/", authorize(["ADMIN"]), asyncHandler(productController.create));

// GET /products — all authenticated users can VIEW
router.get("/", asyncHandler(productController.list));

// GET /products/:id — all can view
router.get("/:id", asyncHandler(productController.getById));

// PUT /products/:id — only ADMIN can edit
router.put("/:id", authorize(["ADMIN"]), asyncHandler(productController.update));

// GET /products/:id/stock-log — all can view stock history
router.get("/:id/stock-log", asyncHandler(productController.getStockLog));

// POST /products/:id/stock-adjust — WAREHOUSE and ADMIN only
router.post("/:id/stock-adjust", authorize(["WAREHOUSE", "ADMIN"]), asyncHandler(productController.stockAdjust));
```

### File 4: `src/routes/challan.ts` - NEEDS FIX

**Current (WRONG):**
```typescript
router.put("/:id/confirm", authorize(["SALES", "MANAGER", "ADMIN"]), ...);
router.put("/:id/cancel", authorize(["SALES", "MANAGER", "ADMIN"]), ...);
```

**Should Be (CORRECT):**
```typescript
// POST /challans — ADMIN and SALES can create
router.post("/", authorize(["ADMIN", "SALES"]), asyncHandler(challanController.create));

// GET /challans — all authenticated users can VIEW
router.get("/", asyncHandler(challanController.list));

// GET /challans/:id — all can view
router.get("/:id", asyncHandler(challanController.getById));

// PUT /challans/:id/confirm — WAREHOUSE and ADMIN only (stock deduction happens here)
router.put("/:id/confirm", authorize(["WAREHOUSE", "ADMIN"]), asyncHandler(challanController.confirm));

// PUT /challans/:id/cancel — ADMIN and SALES can cancel their own drafts, WAREHOUSE can cancel confirmed
router.put("/:id/cancel", authorize(["WAREHOUSE", "ADMIN", "SALES"]), asyncHandler(challanController.cancel));
```

---

## 🌱 SEED DATA - ROLES TO CREATE

Update `prisma/seed.ts` to remove MANAGER and keep only 4:

```typescript
const admin = await prisma.user.create({
  data: {
    name: "Admin User",
    email: "admin@erp.local",
    passwordHash: await bcrypt.hash("admin123", 10),
    role: "ADMIN",
  },
});

const sales = await prisma.user.create({
  data: {
    name: "Sales Manager",
    email: "sales@erp.local",
    passwordHash: await bcrypt.hash("sales123", 10),
    role: "SALES",
  },
});

const warehouse = await prisma.user.create({
  data: {
    name: "Warehouse Manager",
    email: "warehouse@erp.local",
    passwordHash: await bcrypt.hash("warehouse123", 10),
    role: "WAREHOUSE",
  },
});

const accounts = await prisma.user.create({
  data: {
    name: "Accounts Officer",
    email: "accounts@erp.local",
    passwordHash: await bcrypt.hash("accounts123", 10),
    role: "ACCOUNTS",
  },
});

console.log("✓ Created 4 users (ADMIN, SALES, WAREHOUSE, ACCOUNTS)");
```

---

## 🔐 AUTHORIZATION MIDDLEWARE - VERIFY IMPLEMENTATION

**File:** `src/middlewares/authorize.ts`

Should look like this:

```typescript
import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/errors";

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return next(new ForbiddenError("User not authenticated"));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(
        new ForbiddenError(
          `Role '${user.role}' is not allowed to access this resource. Required: ${allowedRoles.join(", ")}`
        )
      );
    }

    next();
  };
}
```

---

## ✅ ENDPOINT SUMMARY (CORRECTED)

### Authentication
```
POST   /auth/login              → Anyone (no auth required)
POST   /auth/register           → ADMIN only (must be authenticated)
```

### Customer Management
```
POST   /customers               → ADMIN, SALES
GET    /customers               → All (view only)
GET    /customers/:id           → All (view only)
PUT    /customers/:id           → ADMIN, SALES
POST   /customers/:id/notes     → ADMIN, SALES
```

### Product Management
```
POST   /products                → ADMIN only
GET    /products                → All (view only)
GET    /products/:id            → All (view only)
PUT    /products/:id            → ADMIN only
GET    /products/:id/stock-log  → All (view only)
POST   /products/:id/stock-adjust → WAREHOUSE, ADMIN
```

### Challan Management
```
POST   /challans                → ADMIN, SALES
GET    /challans                → All (view only)
GET    /challans/:id            → All (view only)
PUT    /challans/:id/confirm    → WAREHOUSE, ADMIN (STOCK DEDUCTION HAPPENS)
PUT    /challans/:id/cancel     → WAREHOUSE, ADMIN, SALES (STOCK REVERSAL)
```

---

## 📊 WORKFLOW WITH CORRECT RBAC

### Day 1: Admin Setup
1. **ADMIN logs in** → admin@erp.local / admin123
2. **ADMIN creates products** → Adds 8 products to system
3. **ADMIN sets initial stock** → Via `/products/:id/stock-adjust` endpoint
4. **ADMIN creates users** → Registers SALES, WAREHOUSE, ACCOUNTS accounts

### Day 2: Sales Makes Sale
1. **SALES logs in** → sales@erp.local / sales123
2. **SALES adds customer** → POST /customers with new customer data
3. **SALES creates challan** → POST /challans with customer + products
4. **SALES saves as DRAFT** → Challan stored, no stock change yet
5. **SALES adds notes** → Track follow-ups on customer

### Day 3: Warehouse Fulfills
1. **WAREHOUSE logs in** → warehouse@erp.local / warehouse123
2. **WAREHOUSE views draft** → GET /challans/:id
3. **WAREHOUSE confirms** → PUT /challans/:id/confirm
   - Backend validates stock exists for all items
   - If OK: deducts stock, logs StockMovement (OUT) for each item
   - If NOT OK: returns error, nothing changes
4. **Stock is now reduced** → Can be seen in GET /products/:id

### Day 4: Accounts Does Billing
1. **ACCOUNTS logs in** → accounts@erp.local / accounts123
2. **ACCOUNTS views confirmed challans** → GET /challans (filtered by CONFIRMED status)
3. **ACCOUNTS views customer data** → GET /customers
4. **ACCOUNTS cannot modify anything** → GET endpoints only (no POST/PUT/DELETE)

---

## ⚠️ CRITICAL IMPLEMENTATION POINTS

### 1. Stock Only Deducts on Confirm
- ❌ WRONG: Stock deducts when SALES creates challan
- ✅ CORRECT: Stock only deducts when WAREHOUSE calls `/challans/:id/confirm`

### 2. Confirm Must Be Atomic
- ✅ All stock checks happen FIRST
- ✅ If any product insufficient, ENTIRE confirm fails, nothing deducts
- ✅ If OK, ALL deductions happen in ONE transaction

### 3. Cancel Reverses Stock
- ✅ When challan cancelled (if CONFIRMED), stock is restored
- ✅ Only CONFIRMED challans affect stock (DRAFT cancellations don't restore)

### 4. ACCOUNTS is Read-Only
- ✅ ACCOUNTS can GET anything (customers, products, challans)
- ❌ ACCOUNTS cannot POST/PUT/DELETE anything

### 5. User Creation is Admin-Only
- ✅ Only ADMIN can call POST /auth/register
- ❌ No public signup endpoint (requirement already met ✓)

---

## 🚀 TESTING EACH ROLE

### Test ADMIN
```bash
# Login as admin
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.local","password":"admin123"}'

# Can create products
curl -X POST http://localhost:4000/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","sku":"SKU-TEST",...}'
```

### Test SALES
```bash
# Login as sales
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@erp.local","password":"sales123"}'

# Can create customers
curl -X POST http://localhost:4000/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer",...}'

# Can create challans
curl -X POST http://localhost:4000/challans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"...","status":"DRAFT",...}'

# Cannot confirm challans (should get 403 Forbidden)
curl -X PUT http://localhost:4000/challans/:id/confirm \
  -H "Authorization: Bearer <token>"
# Response: 403 - Role 'SALES' is not allowed to access this resource
```

### Test WAREHOUSE
```bash
# Login as warehouse
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"warehouse@erp.local","password":"warehouse123"}'

# Can adjust stock
curl -X POST http://localhost:4000/products/:id/stock-adjust \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"quantityChanged":50,"movementType":"IN",...}'

# Can confirm challans (triggers stock deduction)
curl -X PUT http://localhost:4000/challans/:id/confirm \
  -H "Authorization: Bearer <token>"

# Cannot create customers (should get 403)
curl -X POST http://localhost:4000/customers \
  -H "Authorization: Bearer <token>"
# Response: 403 - Role 'WAREHOUSE' is not allowed
```

### Test ACCOUNTS
```bash
# Login as accounts
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"accounts@erp.local","password":"accounts123"}'

# Can view challans
curl -X GET http://localhost:4000/challans \
  -H "Authorization: Bearer <token>"

# Can view customers
curl -X GET http://localhost:4000/customers \
  -H "Authorization: Bearer <token>"

# Cannot create anything (should get 403)
curl -X POST http://localhost:4000/customers \
  -H "Authorization: Bearer <token>"
# Response: 403 - Role 'ACCOUNTS' is not allowed
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Remove MANAGER role from all route files
- [ ] Fix customer routes (remove MANAGER)
- [ ] Fix product routes (ADMIN only for create/edit, WAREHOUSE for stock-adjust)
- [ ] Fix challan routes (WAREHOUSE only for confirm)
- [ ] Update seed.ts to remove MANAGER user
- [ ] Test each role with curl commands above
- [ ] Verify ACCOUNTS is read-only
- [ ] Verify challan confirm only available to WAREHOUSE
- [ ] Verify product creation only available to ADMIN
- [ ] Document the correct RBAC matrix

---

## 📚 KEY TAKEAWAYS

1. **4 Roles Only:** ADMIN, SALES, WAREHOUSE, ACCOUNTS (no MANAGER)
2. **RBAC is Action-Based:** Not "users see different data" but "users can/cannot do actions"
3. **Stock Moves on Confirm:** SALES creates draft, WAREHOUSE confirms (stock deducts)
4. **ACCOUNTS is Read-Only:** Can see everything but cannot modify
5. **Admin-Only:** User creation, product creation, and user management
6. **Atomic Transactions:** Stock deduction must succeed for all items or fail for all items

**This ensures proper business separation and prevents mistakes like Sales staff accidentally creating/deleting products or Warehouse staff confirming orders without checking stock.**

---

**Next Steps:** Apply the fixes above to get correct RBAC implementation.
