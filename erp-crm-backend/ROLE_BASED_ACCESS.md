# Role-Based Access Control & User-Specific Data

## Overview
The CRM system now implements role-based permissions and user-specific data filtering with a new MANAGER role.

## Role Hierarchy & Permissions

### **🔴 ADMIN** (Full System Access)
✅ Can:
- View ALL data from ALL users
- Create customers
- Create challans
- Create products
- Update customers, products, and challans
- Cancel/confirm any challan
- Add customer notes
- No restrictions

---

### **🟠 MANAGER** (See & Update Everything)
✅ Can:
- **View ALL customers** (no filtering)
- **View ALL challans** (including all users')
- **View ALL products**
- ✏️ Update customers
- ✏️ Update products
- ✏️ Update challan status (confirm/cancel)
- ➕ Create new customers
- ➕ Create new challans
- ➕ Create new products
- 📝 Add customer notes

**Perfect for:**
- Operations managers who oversee all teams
- Regional managers
- Department heads
- Supervisors who need visibility into all activities

---

### **🟡 SALES** (Create & See Own)
✅ Can:
- View all customers (shared)
- Create customers
- Create challans (Draft or Confirmed)
- Add customer notes
- Update customer information
- ❌ See ONLY their own created challans
- ❌ Cannot see other sales team members' challans

**Perfect for:**
- Sales representatives
- Account executives
- Relationship managers

---

### **🔵 WAREHOUSE** (Inventory Management)
✅ Can:
- View all products
- View all challans
- Create/update products
- Adjust stock levels
- ❌ Cannot create customers
- ❌ Cannot create challans
- ❌ Read-only on customers

**Perfect for:**
- Warehouse managers
- Inventory controllers
- Stock keepers

---

### **🟢 ACCOUNTS** (Read-Only)
✅ Can:
- View all customers
- View all products
- View all challans
- ❌ Cannot create or modify anything

**Perfect for:**
- Accountants
- Finance team
- Billing department

---

## Data Visibility Matrix

| User Role | Customers | Challans | Products | Can Modify |
|-----------|-----------|----------|----------|-----------|
| **ADMIN** | See all | See all | See all | ✅ Yes |
| **MANAGER** | See all | See all | See all | ✅ Yes |
| **SALES** | See all | Own only | See all | ✅ Limited |
| **WAREHOUSE** | See all (RO) | See all (RO) | See all | ✅ Products |
| **ACCOUNTS** | See all (RO) | See all (RO) | See all (RO) | ❌ No |

---

## API Permissions Summary

### **Customers Endpoint**
```
POST   /customers       → SALES, MANAGER, ADMIN
GET    /customers       → All roles
GET    /customers/:id   → All roles
PUT    /customers/:id   → SALES, MANAGER, ADMIN
POST   /customers/:id/notes → SALES, MANAGER, ADMIN
```

### **Products Endpoint**
```
POST   /products        → ADMIN, MANAGER, WAREHOUSE
GET    /products        → All roles
GET    /products/:id    → All roles
PUT    /products/:id    → ADMIN, MANAGER, WAREHOUSE
POST   /products/:id/stock-adjust → WAREHOUSE
```

### **Challans Endpoint**
```
POST   /challans        → SALES, MANAGER, ADMIN
GET    /challans        → All roles (filtered by role)
GET    /challans/:id    → All roles
PUT    /challans/:id/confirm → SALES, MANAGER, ADMIN
PUT    /challans/:id/cancel  → SALES, MANAGER, ADMIN
```

---

## Test Credentials

### Test the MANAGER Role
```
Email: manager@erp.local
Password: manager123
```

### Other Test Credentials
```
ADMIN:     admin@erp.local / admin123
SALES:     sales@erp.local / sales123
WAREHOUSE: warehouse@erp.local / warehouse123
ACCOUNTS:  accounts@erp.local / accounts123
```

---

## How to Test MANAGER Role

### Login as MANAGER
1. Go to http://localhost:3000
2. Enter: `manager@erp.local` / `manager123`
3. You should see:

#### ✅ In Customers Tab
- ✅ Can see all 20 customers
- ✅ Button "Add New Customer" is visible & enabled
- ✅ Can update any customer

#### ✅ In Products Tab
- ✅ Can see all 20 products
- ✅ Button "Add New Product" is visible & enabled
- ✅ Can update any product

#### ✅ In Challans Tab
- ✅ Can see ALL 22 challans (including those created by SALES)
- ✅ Button "Create Challan" is visible & enabled
- ✅ Can confirm/cancel any challan
- ✅ Can create new challans

---

## Comparing Roles in Action

### Test Scenario: View Other User's Challan

**Login as SALES** (`sales@erp.local / sales123`)
- Sales Rep creates Challan #1
- Sees their own challan in the list
- Clicks on challans tab → sees only their challan

**Switch to MANAGER** (`manager@erp.local / manager123`)
- Clicks on challans tab
- **Sees Challan #1** created by SALES
- Can update/confirm it
- Can see ALL challans in system

**Switch to ADMIN** (`admin@erp.local / admin123`)
- Same as MANAGER
- Can see everything
- Has full control

---

## Security Notes

⚠️ **All permissions are validated server-side**
- Frontend buttons reflect user role for UX
- API endpoints verify role on every request
- JWT token contains user role
- Non-managers cannot bypass filters via API

---

## Database Users

Current seeded users:
1. **admin@erp.local** - ADMIN role
2. **manager@erp.local** - MANAGER role ← NEW
3. **sales@erp.local** - SALES role
4. **warehouse@erp.local** - WAREHOUSE role
5. **accounts@erp.local** - ACCOUNTS role



