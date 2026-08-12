# Quick Reference - All Test Users

## 🚀 Quick Start

**Frontend URL:** http://localhost:3000
**Backend URL:** http://localhost:4000

---

## Test Users (Copy & Paste)

### 👑 ADMIN (Full Access)
```
Email:    admin@erp.local
Password: admin123
```
✅ See everything, do everything

---

### 🔶 MANAGER (Supervisor - See & Update All) ⭐ NEW
```
Email:    manager@erp.local
Password: manager123
```
✅ See all customers, challans, products
✅ Create and modify anything
✅ Monitor team activities
✅ Approve transactions

---

### 💼 SALES (Create Own Data)
```
Email:    sales@erp.local
Password: sales123
```
✅ Create customers and challans
✅ See own challans only
❌ Can't see other sales team's challans

---

### 📦 WAREHOUSE (Inventory Only)
```
Email:    warehouse@erp.local
Password: warehouse123
```
✅ Manage products & stock
❌ Can't create customers or challans

---

### 📊 ACCOUNTS (Read-Only)
```
Email:    accounts@erp.local
Password: accounts123
```
✅ View everything
❌ Can't modify anything

---

## What Each Role Can Do

### Features Matrix

|  | ADMIN | MANAGER | SALES | WAREHOUSE | ACCOUNTS |
|--|-------|---------|-------|-----------|----------|
| **See ALL Data** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **See Own Data** | ✅ | ✅ | ✅ | N/A | N/A |
| **Add Customers** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Add Products** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Create Challans** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Update Customers** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Update Products** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Confirm Challans** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View All Challans** | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## Best Use Cases

### Use ADMIN for
- System configuration
- User management
- Full system control

### Use MANAGER for ⭐ RECOMMENDED
- Team leaders
- Supervisors
- Regional managers
- Operations oversight
- Approving transactions
- Monitoring all activities

### Use SALES for
- Sales representatives
- Account executives
- Outside sales teams

### Use WAREHOUSE for
- Inventory managers
- Stock keepers
- Warehouse staff

### Use ACCOUNTS for
- Accountants
- Finance team
- Billing department

---

## Data Sample

### 20 Customers
ABC Retail Store, XYZ Wholesale Traders, PQR Distribution Hub, etc.

### 20 Products
Industrial Bearing, Motor Oil, Steel Fasteners, Hydraulic Pump, etc.

### 22 Challans
Mix of DRAFT and CONFIRMED status from seeded data

### 12 Customer Notes
Tracking preferences and behaviors

---

## Testing Scenario

### 1. Login as SALES
- Create a new challan
- Note: You see ONLY your challan in the list

### 2. Login as another SALES account (doesn't exist yet, skip)
- Would not see previous SALES user's challan

### 3. Login as MANAGER
- You see ALL challans including the one just created
- You can update/confirm it
- You have full visibility

### 4. Confirm
- MANAGER sees everything
- SALES sees own data only
- ADMIN sees everything
- WAREHOUSE sees all (read-only except products)
- ACCOUNTS sees all (read-only)

---

## API Endpoints

**All endpoints require authentication (JWT token)**

### Authentication
```
POST /auth/login
Body: { email, password }
Returns: { token }
```

### Customers
```
GET    /customers           → All users
POST   /customers           → SALES, MANAGER, ADMIN
GET    /customers/:id       → All users
PUT    /customers/:id       → SALES, MANAGER, ADMIN
POST   /customers/:id/notes → SALES, MANAGER, ADMIN
```

### Products
```
GET    /products            → All users
POST   /products            → ADMIN, MANAGER, WAREHOUSE
GET    /products/:id        → All users
PUT    /products/:id        → ADMIN, MANAGER, WAREHOUSE
POST   /products/:id/stock-adjust → WAREHOUSE
```

### Challans
```
GET    /challans            → All users (filtered by role)
POST   /challans            → SALES, MANAGER, ADMIN
GET    /challans/:id        → All users
PUT    /challans/:id/confirm → SALES, MANAGER, ADMIN
PUT    /challans/:id/cancel  → SALES, MANAGER, ADMIN
```

---

## Key Features

✅ **Role-Based Access Control** (RBAC)
- Enforced server-side
- JWT token validation
- Per-endpoint authorization

✅ **User-Specific Data Filtering**
- SALES sees own challans only
- MANAGER sees all data
- ADMIN sees everything

✅ **Real-Time Updates**
- Hot module reloading in development
- Auto-reload on code changes

✅ **Full CRUD Operations**
- Create customers, products, challans
- Read all data
- Update (where authorized)
- Delete/Cancel (where authorized)

---

## Development Servers

Both running and auto-reloading:

```
Frontend Dev Server:  http://localhost:3000
Backend API Server:   http://localhost:4000
```

Changes to code automatically reload both servers.

---

## Common Tasks

### 1. Create Challan as SALES
- Login as sales@erp.local
- Go to Challans tab
- Click "Create Challan"
- Select customer
- Add items
- Submit

### 2. View ALL Challans as MANAGER
- Login as manager@erp.local
- Go to Challans tab
- See all challans including SALES team's

### 3. Confirm a Draft Challan
- Login as MANAGER or ADMIN
- Go to Challans tab
- Find draft challan
- Click confirm button

### 4. Add New Customer
- Login as SALES or MANAGER
- Go to Customers tab
- Click "Add New Customer"
- Fill form
- Submit

### 5. Update Product Inventory
- Login as MANAGER or WAREHOUSE
- Go to Products tab
- Select product
- Update stock/prices

---

## Troubleshooting

### Button not appearing?
Check your role - some buttons only show for authorized roles

### Can't see other team's data?
Correct! SALES only sees own challans. Use MANAGER account to see all.

### Getting 401 Unauthorized?
Login again - token may have expired

### API returning 403 Forbidden?
Your role doesn't have permission for that action

---

## Summary

**Want to test management features?**
Use: `manager@erp.local` / `manager123`

**Want to test sales features?**
Use: `sales@erp.local` / `sales123`

**Want full system access?**
Use: `admin@erp.local` / admin123`

**Want to view only?**
Use: `accounts@erp.local` / `accounts123`

