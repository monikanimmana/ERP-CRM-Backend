# Database Schema Documentation

## Overview

PostgreSQL database with 7 models managed by Prisma ORM. All models use `cuid()` for IDs (collision-resistant, URL-safe).

## Models

### 1. User

Represents system users with role-based access control.

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(SALES)
  createdAt    DateTime @default(now())
}

enum Role {
  ADMIN
  SALES
  WAREHOUSE
  ACCOUNTS
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `name` | String | User's full name |
| `email` | String | Unique; used for login |
| `passwordHash` | String | bcrypt hash (never store plaintext) |
| `role` | Enum | ADMIN, SALES, WAREHOUSE, or ACCOUNTS |
| `createdAt` | DateTime | Auto-set to now() |

**Indexes:**

- `email` — UNIQUE (for login queries)

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "name": "Sales Manager",
  "email": "sales@erp.local",
  "passwordHash": "$2b$10$...",
  "role": "SALES",
  "createdAt": "2026-08-10T10:00:00Z"
}
```

---

### 2. Customer

Represents business customers (retail stores, wholesalers, distributors).

```prisma
model Customer {
  id           String         @id @default(cuid())
  name         String
  mobile       String
  email        String?
  businessName String
  gstNumber    String?
  customerType CustomerType   @default(RETAIL)
  address      String
  status       CustomerStatus @default(LEAD)
  followUpDate DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  notes    CustomerNote[]
  challans Challan[]
}

enum CustomerType {
  RETAIL
  WHOLESALE
  DISTRIBUTOR
}

enum CustomerStatus {
  LEAD
  ACTIVE
  INACTIVE
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `name` | String | Contact person name |
| `mobile` | String | Phone number |
| `email` | String? | Optional |
| `businessName` | String | Official business name |
| `gstNumber` | String? | Optional GST ID |
| `customerType` | Enum | RETAIL, WHOLESALE, or DISTRIBUTOR |
| `address` | String | Full address |
| `status` | Enum | LEAD, ACTIVE, or INACTIVE |
| `followUpDate` | DateTime? | Next follow-up date |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |
| `notes` | CustomerNote[] | Relation to notes |
| `challans` | Challan[] | Relation to challans |

**Indexes:**

- `name`, `mobile`, `businessName` — For search queries
- `status` — For filtering
- `customerType` — For categorization

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "name": "ABC Store Manager",
  "mobile": "9876543210",
  "email": "abc@retail.com",
  "businessName": "ABC Retail Store Pvt Ltd",
  "gstNumber": "27AABCU1234H1Z0",
  "customerType": "RETAIL",
  "address": "123 Main Street, Mumbai",
  "status": "ACTIVE",
  "followUpDate": "2026-08-20T10:00:00Z",
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-10T14:30:00Z"
}
```

---

### 3. CustomerNote

Audit trail of follow-ups, calls, notes for each customer.

```prisma
model CustomerNote {
  id         String   @id @default(cuid())
  customerId String
  note       String
  createdBy  String   // userId
  createdAt  DateTime @default(now())

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `customerId` | String | Foreign key to Customer |
| `note` | String | Note text |
| `createdBy` | String | User ID of note author |
| `createdAt` | DateTime | Auto-set |

**Relationships:**

- **Customer** (One-to-Many) — A customer has many notes

**Cascade:** If customer is deleted, all notes are deleted

**Indexes:**

- `customerId` — For querying notes by customer

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "customerId": "clk7z8f4s000a0h4x1z2y3a4c",
  "note": "Called on 2026-08-10, prefers bulk orders on Mondays",
  "createdBy": "clk7z8f4s000a0h4x1z2y3a4d",
  "createdAt": "2026-08-10T10:30:00Z"
}
```

---

### 4. Product

Inventory items with pricing and stock levels.

```prisma
model Product {
  id                String   @id @default(cuid())
  name              String
  sku               String   @unique
  category          String
  unitPrice         Decimal  @db.Decimal(12, 2)
  currentStock      Int      @default(0)
  minStockAlert     Int      @default(10)
  warehouseLocation String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  stockMovements StockMovement[]
  challanItems   ChallanItem[]
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `name` | String | Product name |
| `sku` | String | Unique stock keeping unit |
| `category` | String | Product category |
| `unitPrice` | Decimal(12,2) | Price per unit |
| `currentStock` | Int | Current quantity in warehouse |
| `minStockAlert` | Int | Low-stock threshold |
| `warehouseLocation` | String | Storage location code |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Constraints:**

- `SKU` — UNIQUE (no duplicates)
- `currentStock` — CHECK (currentStock >= 0) — enforced at DB level

**Indexes:**

- `sku`, `name` — For search
- `category` — For filtering

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "name": "Industrial Bearing Type A",
  "sku": "SKU-001",
  "category": "Bearings",
  "unitPrice": 1500.00,
  "currentStock": 45,
  "minStockAlert": 20,
  "warehouseLocation": "Rack A1",
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-10T14:30:00Z"
}
```

---

### 5. StockMovement

Audit log of all stock IN/OUT transactions.

```prisma
model StockMovement {
  id              String       @id @default(cuid())
  productId       String
  quantityChanged Int          // always positive; direction in movementType
  movementType    MovementType
  reason          String
  createdBy       String       // userId
  createdAt       DateTime     @default(now())

  product Product @relation(fields: [productId], references: [id])
}

enum MovementType {
  IN
  OUT
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `productId` | String | Foreign key to Product |
| `quantityChanged` | Int | Quantity (always positive) |
| `movementType` | Enum | IN or OUT |
| `reason` | String | Why (e.g., "Challan CH-2026-0001", "Damage write-off") |
| `createdBy` | String | User ID who initiated |
| `createdAt` | DateTime | Auto-set |

**Relationships:**

- **Product** (Many-to-One) — Many movements belong to one product

**Indexes:**

- `productId`, `createdAt` — For stock log queries
- `movementType` — For type filtering

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "productId": "clk7z8f4s000a0h4x1z2y3a4c",
  "quantityChanged": 5,
  "movementType": "OUT",
  "reason": "Challan CH-2026-0002",
  "createdBy": "clk7z8f4s000a0h4x1z2y3a4d",
  "createdAt": "2026-08-10T14:30:00Z"
}
```

---

### 6. Challan

Sales/delivery orders to customers.

```prisma
model Challan {
  id            String        @id @default(cuid())
  challanNumber String        @unique
  customerId    String
  status        ChallanStatus @default(DRAFT)
  totalQuantity Int           @default(0)
  createdBy     String        // userId
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  customer Customer      @relation(fields: [customerId], references: [id])
  items    ChallanItem[]
}

enum ChallanStatus {
  DRAFT
  CONFIRMED
  CANCELLED
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `challanNumber` | String | Unique human-readable number (CH-2026-0001) |
| `customerId` | String | Foreign key to Customer |
| `status` | Enum | DRAFT, CONFIRMED, or CANCELLED |
| `totalQuantity` | Int | Sum of all item quantities |
| `createdBy` | String | User ID who created |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Constraints:**

- `challanNumber` — UNIQUE, format CH-YYYY-NNNN

**Indexes:**

- `customerId`, `status`, `createdAt` — For filtering/sorting
- `challanNumber` — For lookup

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "challanNumber": "CH-2026-0001",
  "customerId": "clk7z8f4s000a0h4x1z2y3a4c",
  "status": "CONFIRMED",
  "totalQuantity": 5,
  "createdBy": "clk7z8f4s000a0h4x1z2y3a4d",
  "createdAt": "2026-08-10T14:30:00Z",
  "updatedAt": "2026-08-10T14:30:00Z"
}
```

---

### 7. ChallanItem

Line items within a challan, with product snapshots.

```prisma
model ChallanItem {
  id                  String  @id @default(cuid())
  challanId           String
  productId           String
  productNameSnapshot String
  productSkuSnapshot  String
  unitPriceSnapshot   Decimal @db.Decimal(12, 2)
  quantity            Int

  challan Challan @relation(fields: [challanId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
}
```

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `challanId` | String | Foreign key to Challan |
| `productId` | String | Foreign key to Product |
| `productNameSnapshot` | String | Product name at time of challan creation |
| `productSkuSnapshot` | String | Product SKU at time of creation |
| `unitPriceSnapshot` | Decimal(12,2) | Price at time of creation |
| `quantity` | Int | Quantity ordered |

**Relationships:**

- **Challan** (Many-to-One) — Many items in one challan
- **Product** (Many-to-One) — Item references product (for audit)

**Cascade:** If challan is deleted, all items are deleted

**Why Snapshots?** Future product changes (name, price) should not affect historical challan records. Snapshots preserve the business state at transaction time.

**Example:**

```json
{
  "id": "clk7z8f4s000a0h4x1z2y3a4b",
  "challanId": "clk7z8f4s000a0h4x1z2y3a4c",
  "productId": "clk7z8f4s000a0h4x1z2y3a4d",
  "productNameSnapshot": "Industrial Bearing Type A",
  "productSkuSnapshot": "SKU-001",
  "unitPriceSnapshot": 1500.00,
  "quantity": 5
}
```

---

## Relationships

```
User
  ├─ created Challans (createdBy)
  ├─ created CustomerNotes (createdBy)
  ├─ created StockMovements (createdBy)
  
Customer
  ├─ has many CustomerNotes (1-to-M)
  ├─ has many Challans (1-to-M)

Challan
  ├─ belongs to Customer
  ├─ created by User (createdBy)
  ├─ has many ChallanItems (1-to-M)

ChallanItem
  ├─ belongs to Challan
  ├─ references Product (for audit trail)

Product
  ├─ has many StockMovements (1-to-M)
  ├─ has many ChallanItems (1-to-M)

StockMovement
  └─ belongs to Product
```

---

## Queries & Transactions

### Stock Adjustment (Atomic)

```sql
BEGIN TRANSACTION;
  SELECT currentStock FROM products WHERE id = $1 FOR UPDATE; -- Lock row
  UPDATE products SET currentStock = currentStock + $2 WHERE id = $1;
  INSERT INTO stock_movements (productId, quantityChanged, movementType, reason, createdBy) 
    VALUES ($1, $2, $3, $4, $5);
COMMIT;
```

### Challan Confirmation (Atomic)

```sql
BEGIN TRANSACTION;
  -- Lock all products
  SELECT id, currentStock FROM products WHERE id IN ($1, $2, ...) FOR UPDATE;
  
  -- Validate stock
  SELECT COUNT(*) WHERE currentStock < requested_qty FOR ANY ITEM
  IF validation_fails: ROLLBACK;
  
  -- Deduct stock
  UPDATE products SET currentStock = currentStock - $qty WHERE id IN (...);
  
  -- Record movements
  INSERT INTO stock_movements (...) VALUES (...);
  
  -- Update challan status
  UPDATE challans SET status = 'CONFIRMED' WHERE id = $1;
COMMIT;
```

---

## Indexes

Add these for performance (Prisma will create primary keys and uniques automatically):

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Customers
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_customerType ON customers("customerType");

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);

-- StockMovements
CREATE INDEX idx_stock_movements_productId ON stock_movements("productId");
CREATE INDEX idx_stock_movements_createdAt ON stock_movements("createdAt");
CREATE INDEX idx_stock_movements_productId_createdAt ON stock_movements("productId", "createdAt");

-- Challans
CREATE INDEX idx_challans_customerId ON challans("customerId");
CREATE INDEX idx_challans_status ON challans(status);
CREATE INDEX idx_challans_createdAt ON challans("createdAt");
CREATE INDEX idx_challans_challanNumber ON challans("challanNumber");

-- ChallanItems
CREATE INDEX idx_challan_items_challanId ON challan_items("challanId");
```

---

## Migrations

Prisma manages schema versioning:

```bash
# After editing schema.prisma:
npm run db:migrate

# Creates timestamped migration file in prisma/migrations/
# Re-run on any environment to apply all pending migrations
```

Each migration is idempotent and can be replayed without side effects.

---

## Backup & Recovery

```bash
# Backup
pg_dump erp_crm_db > backup_2026_08_10.sql

# Restore
psql erp_crm_db < backup_2026_08_10.sql
```

For AWS RDS or managed databases, use cloud-native backup features (snapshots, automated backups).

---

## Scalability Notes

1. **Partitioning:** For very large `StockMovement` tables, consider partitioning by year or month.
2. **Archive:** Move old challans (> 2 years) to archive table/database.
3. **Read Replicas:** For read-heavy queries (reports, dashboards), use PostgreSQL read replicas.
4. **Search:** For complex search, migrate to Elasticsearch.
5. **Connection Pooling:** Use PgBouncer or Prisma's built-in pooling in production.
