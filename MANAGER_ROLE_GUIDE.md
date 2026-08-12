# 🔐 MANAGER Role Guide - See & Update Everything

## What's New?

I've created a new **MANAGER** role that can:
- ✅ See ALL data (customers, products, challans)
- ✅ Update/modify anything
- ✅ Create customers, products, and challans
- ✅ Monitor all team activities

Perfect for managers, supervisors, and team leads!

---

## Login Credentials for MANAGER

```
Email:    manager@erp.local
Password: manager123
```

---

## What MANAGER Can Do

### 👥 Customers
- ✅ See all 20 customers (no filtering)
- ✅ Create new customers
- ✅ Update any customer info
- ✅ Add notes to any customer

### 📦 Products
- ✅ See all 20 products
- ✅ Create new products
- ✅ Update product prices & stock alerts
- ✅ Manage inventory

### 📄 Challans
- ✅ See ALL 22 challans from all team members
- ✅ Create new challans
- ✅ Confirm draft challans
- ✅ Cancel any challan
- ✅ Full visibility into all sales operations

---

## All User Roles

| Role | Email | Password | Can See All Data | Can Modify |
|------|-------|----------|------------------|-----------|
| **ADMIN** | admin@erp.local | admin123 | ✅ Yes | ✅ Full |
| **MANAGER** ⭐ | manager@erp.local | manager123 | ✅ Yes | ✅ Full |
| **SALES** | sales@erp.local | sales123 | 📊 Own only | ✅ Own |
| **WAREHOUSE** | warehouse@erp.local | warehouse123 | ✅ Yes (RO) | ✅ Products |
| **ACCOUNTS** | accounts@erp.local | accounts123 | ✅ Yes (RO) | ❌ No |

---

## Key Differences: MANAGER vs SALES

### SALES User (sales@erp.local)
```
Login → Customers Tab
  ✅ See all 20 customers

Login → Challans Tab
  ⚠️ See ONLY their own challans
  (Other sales team members' challans hidden)

Cannot see other team members' work
```

### MANAGER User (manager@erp.local)
```
Login → Customers Tab
  ✅ See all 20 customers

Login → Challans Tab
  ✅ See ALL 22 challans
  ✅ See work from all SALES team members
  ✅ Can approve/modify any challan

Full oversight of operations
```

---

## How to Test

### Step 1: Login as MANAGER
1. Open http://localhost:3000
2. Enter credentials:
   - Email: `manager@erp.local`
   - Password: `manager123`
3. Click Login

### Step 2: Check What You Can See
- **Customers Tab** → See all customers ✅
- **Products Tab** → See all products ✅
- **Challans Tab** → See all challans including SALES team's ✅

### Step 3: Try Updating Data
- Click on a customer → Edit details ✅
- Click "Create Challan" button → Create new challan ✅
- Select products and quantities ✅

### Step 4: Compare with SALES Role
1. Logout
2. Login as `sales@erp.local` / `sales123`
3. Go to Challans tab
4. Notice you only see your own challans
5. Switch back to MANAGER to see all

---

## Use Cases for MANAGER Role

### Operations Manager
- Monitor all sales team activities
- Oversee customer relationships across teams
- Approve challans
- Manage inventory levels
- Generate reports on team performance

### Regional Manager
- See all customers and sales in region
- Approve customer modifications
- Manage product inventory
- Monitor challan status
- Ensure team compliance

### Team Lead/Supervisor
- Oversee team member's work
- Approve customer interactions
- Modify customer data if needed
- Track sales progress
- Support team members

### Department Head
- Full visibility into operations
- Make strategic decisions
- Optimize inventory
- Track all transactions
- Manage team performance

---

## Security

✅ **All permissions checked on the server**
- MANAGER cannot bypass restrictions via API
- Each request validated against user role
- JWT token contains role verification
- Frontend buttons reflect actual permissions

---

## Database

MANAGER user created in database:
```
Name:  Operations Manager
Email: manager@erp.local
Role:  MANAGER
```

Total users in system:
1. Admin
2. Manager ⭐ NEW
3. Sales
4. Warehouse
5. Accounts

---

## Backend API Changes

MANAGER role added to all endpoints:

```
POST /customers       → SALES, MANAGER, ADMIN
POST /products        → ADMIN, MANAGER, WAREHOUSE
POST /challans        → SALES, MANAGER, ADMIN
PUT /customers/:id    → SALES, MANAGER, ADMIN
PUT /products/:id     → ADMIN, MANAGER, WAREHOUSE
PUT /challans/:id/confirm → SALES, MANAGER, ADMIN
PUT /challans/:id/cancel  → SALES, MANAGER, ADMIN
```

---

## Testing URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

---

## Summary

| Feature | SALES | MANAGER | ADMIN |
|---------|-------|---------|-------|
| See own data | ✅ | ✅ | ✅ |
| See all data | ❌ | ✅ | ✅ |
| Create data | ✅ | ✅ | ✅ |
| Modify data | ✅ | ✅ | ✅ |
| Modify others' data | ❌ | ✅ | ✅ |
| System admin | ❌ | ❌ | ✅ |

Manager is the perfect middle ground: **See everything, control everything, but isn't a system admin.**

