# 🏢 ERP + CRM Backend

A production-ready **Node.js + Express + TypeScript** backend for a comprehensive Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system. Features role-based access control (RBAC), JWT authentication, and complete business logic for managing customers, products, stock, and sales operations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🎯 Overview

This backend API powers a complete ERP + CRM solution for wholesale/distribution companies. It manages:

- **Customer Relationship Management** - Track leads, active customers, customer notes
- **Product Inventory** - Manage products, stock levels, warehouse locations
- **Sales Challans** - Create, manage, and confirm sales orders
- **Stock Tracking** - Record IN/OUT movements, atomic transactions
- **User Authentication** - JWT-based auth with bcrypt password hashing
- **Role-Based Access Control** - 4 roles with granular permissions

### Key Business Logic

✅ **Stock deduction only on challan confirmation** (not on creation)  
✅ **Atomic transactions** - all or nothing stock updates  
✅ **Data shared company-wide** - RBAC controls actions, not visibility  
✅ **Admin-only user creation** - no public registration  
✅ **Reversible operations** - cancelled challans restore stock  

---

## ✨ Features

### Authentication & Authorization
- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Protected routes with middleware

### User Roles (4 Total)
| Role | Capabilities |
|------|--------------|
| **ADMIN** | Full system access, create users, manage all data |
| **SALES** | Create customers, create draft challans, add notes |
| **WAREHOUSE** | Adjust stock, confirm challans (triggers stock deduction) |
| **ACCOUNTS** | Read-only access for billing/invoicing |

### Core Modules

#### 👥 Customer Management
- Create, read, update customers
- Track customer type (Retail, Wholesale, Distributor)
- Maintain follow-up dates
- Add customer notes
- Status tracking (Lead, Active, Inactive)

#### 📦 Product & Inventory
- Manage product catalog
- Track current stock levels
- Set minimum stock alerts
- Record warehouse locations
- Inventory movement history

#### 📄 Sales Challans
- Create sales orders (challans)
- Add multiple line items
- Draft and confirmation workflow
- Automatic stock deduction on confirm
- Reverse stock on cancel

#### 📊 Stock Movements
- Track all IN/OUT movements
- Reason logging
- User accountability
- Movement history

### API Features
- 25+ REST endpoints
- Input validation (Zod)
- Comprehensive error handling
- Pagination support
- Search and filter capabilities

---

## 🛠️ Tech Stack

### Core
- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **Package Manager:** npm

### Database
- **Database:** PostgreSQL 15
- **ORM:** Prisma 5.x
- **Migrations:** Prisma Migrate

### Authentication & Security
- **JWT:** jsonwebtoken 9.x
- **Password Hashing:** bcrypt 5.x
- **Validation:** Zod 3.x

### Development
- **Build:** TypeScript Compiler (tsc)
- **Dev Server:** ts-node-dev
- **CORS:** cors 2.x

### Deployment
- **Database:** Neon.tech (PostgreSQL)
- **Hosting:** Railway.app
- **Containerization:** Docker & Docker Compose

---

## 📦 Prerequisites

### Required
- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **PostgreSQL** 15+ OR Docker (for PostgreSQL container)

### Optional
- **Docker** & **Docker Compose** (for containerized setup)
- **Git** (for version control)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/monikanimmana/ERP-CRM-Backend.git
cd ERP-CRM-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/erp_crm_db"

# JWT
JWT_SECRET="your_secret_key_here_min_32_characters"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV="development"

# Frontend
FRONTEND_URL="http://localhost:3000"
```

**For Production (Railway):**
```env
DATABASE_URL="postgresql://user:password@host/erp_crm_db"
JWT_SECRET="long_random_secret_string"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="production"
FRONTEND_URL="https://your-frontend.vercel.app"
```

---

## ⚙️ Configuration

### Database Setup

#### Option 1: PostgreSQL Locally
```bash
# Create database
createdb erp_crm_db

# Run migrations
npx prisma migrate dev

# Seed test data
npx prisma db seed
```

#### Option 2: Docker (Recommended)
```bash
docker-compose up --build
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

#### Option 3: Neon.tech (Cloud - Recommended for Production)
1. Go to [neon.tech](https://neon.tech)
2. Create free account
3. Create PostgreSQL project
4. Copy connection string to `DATABASE_URL` in `.env`

### Prisma Setup

```bash
# Generate Prisma client
npx prisma generate

# Create/update database schema
npx prisma migrate dev --name "migration_name"

# View database GUI
npx prisma studio

# Seed test data
npx prisma db seed
```

---

## 🏃 Running Locally

### Development Mode (with Hot Reload)

```bash
npm run dev
```

Server will start at: `http://localhost:4000`

### Production Mode

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database (WARNING: deletes all data) |

---

## 📊 Database

### Schema Overview

```
User (Authentication)
├─ id: String (Primary Key)
├─ email: String (Unique)
├─ name: String
├─ passwordHash: String
├─ role: Enum (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
└─ Timestamps

Customer (CRM)
├─ id: String (Primary Key)
├─ name: String
├─ email: String
├─ mobile: String
├─ businessName: String
├─ gstNumber: String (Optional)
├─ customerType: Enum (RETAIL, WHOLESALE, DISTRIBUTOR)
├─ address: String
├─ status: Enum (LEAD, ACTIVE, INACTIVE)
├─ followUpDate: DateTime (Optional)
├─ Relationships: Notes[], Challans[]
└─ Timestamps

Product (Inventory)
├─ id: String (Primary Key)
├─ name: String
├─ sku: String (Unique)
├─ category: String
├─ unitPrice: Float
├─ currentStock: Int
├─ minStockAlert: Int
├─ warehouseLocation: String
├─ Relationships: ChallanItems[], StockMovements[]
└─ Timestamps

Challan (Sales Order)
├─ id: String (Primary Key)
├─ challanNumber: String (Unique)
├─ customerId: String (Foreign Key)
├─ status: Enum (DRAFT, CONFIRMED, CANCELLED)
├─ totalQuantity: Int
├─ createdBy: String (Foreign Key - User)
├─ Relationships: Items[], Customer, CreatedByUser
└─ Timestamps

StockMovement (Inventory Tracking)
├─ id: String (Primary Key)
├─ productId: String (Foreign Key)
├─ quantityChanged: Int
├─ movementType: Enum (IN, OUT)
├─ reason: String
├─ createdBy: String (Foreign Key - User)
├─ Relationships: Product, User
└─ Timestamps

CustomerNote (CRM Follow-ups)
├─ id: String (Primary Key)
├─ customerId: String (Foreign Key)
├─ note: String
├─ createdBy: String (Foreign Key - User)
├─ Relationships: Customer, User
└─ Timestamps
```

### Key Relationships

```
User ──── (creates) ──── Customer
User ──── (creates) ──── Challan
Challan ──── (contains) ──── ChallanItem
ChallanItem ──── (references) ──── Product
Product ──── (has) ──── StockMovement
User ──── (creates) ──── StockMovement
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@erp.local",
  "password": "admin123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "name": "Admin User",
    "email": "admin@erp.local",
    "role": "ADMIN"
  }
}
```

#### Register (Admin Only)
```http
POST /auth/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New User",
  "email": "user@erp.local",
  "password": "password123",
  "role": "SALES"
}

Response: 201 Created
{
  "data": {
    "id": "user_id",
    "name": "New User",
    "email": "user@erp.local",
    "role": "SALES"
  }
}
```

### Customer Endpoints

```http
# Get all customers
GET /customers?page=1&limit=20

# Create customer (ADMIN, SALES)
POST /customers
{
  "name": "ABC Store",
  "mobile": "9876543210",
  "email": "abc@store.com",
  "businessName": "ABC Store Pvt Ltd",
  "customerType": "RETAIL",
  "status": "ACTIVE"
}

# Get customer details
GET /customers/:id

# Update customer (ADMIN, SALES)
PUT /customers/:id
{
  "name": "Updated Name",
  "status": "INACTIVE"
}

# Add customer note (ADMIN, SALES)
POST /customers/:id/notes
{
  "note": "Follow up in 2 weeks"
}
```

### Product Endpoints

```http
# Get all products
GET /products?page=1&limit=20

# Create product (ADMIN only)
POST /products
{
  "name": "Product Name",
  "sku": "SKU-001",
  "category": "Electronics",
  "unitPrice": 1500,
  "minStockAlert": 10,
  "warehouseLocation": "Rack A1"
}

# Get product details
GET /products/:id

# Update product (ADMIN only)
PUT /products/:id
{
  "name": "Updated Name",
  "unitPrice": 2000
}

# Adjust stock (ADMIN, WAREHOUSE)
POST /products/:id/adjust-stock
{
  "quantity": 50,
  "type": "IN",
  "reason": "Stock received"
}
```

### Challan Endpoints

```http
# Get all challans
GET /challans?page=1&limit=20

# Create challan (ADMIN, SALES)
POST /challans
{
  "customerId": "cust_id",
  "items": [
    {
      "productId": "prod_id",
      "quantity": 5
    }
  ],
  "status": "DRAFT"
}

# Get challan details
GET /challans/:id

# Confirm challan (ADMIN, WAREHOUSE) - DEDUCTS STOCK
PUT /challans/:id/confirm

# Cancel challan (ADMIN, SALES)
PUT /challans/:id/cancel
```

### Stock Movement Endpoints

```http
# Get stock movements
GET /stock-movements?page=1&limit=20

# Get movements for product
GET /products/:id/movements
```

---

## 📁 Project Structure

```
erp-crm-backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   ├── prisma.ts           # Prisma client instance
│   │   ├── env.ts              # Environment variables
│   │   └── database.ts         # Database configuration
│   ├── controllers/
│   │   ├── auth.ts             # Authentication controller
│   │   ├── customer.ts         # Customer controller
│   │   ├── product.ts          # Product controller
│   │   └── challan.ts          # Challan controller
│   ├── services/
│   │   ├── auth.ts             # Auth business logic
│   │   ├── customer.ts         # Customer business logic
│   │   ├── product.ts          # Product business logic
│   │   └── challan.ts          # Challan business logic
│   ├── routes/
│   │   ├── auth.ts             # Auth routes
│   │   ├── customer.ts         # Customer routes
│   │   ├── product.ts          # Product routes
│   │   └── challan.ts          # Challan routes
│   ├── middlewares/
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── authorize.ts        # Role-based access
│   │   └── errorHandler.ts     # Error handling
│   ├── validators/
│   │   ├── auth.ts             # Auth validation schemas
│   │   ├── customer.ts         # Customer validation schemas
│   │   ├── product.ts          # Product validation schemas
│   │   └── challan.ts          # Challan validation schemas
│   └── utils/
│       ├── errors.ts           # Custom error classes
│       └── helpers.ts          # Utility functions
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding
├── dist/                       # Compiled JavaScript (generated)
├── node_modules/              # Dependencies (generated)
├── .env                        # Environment variables (local)
├── .env.example                # Example environment file
├── .gitignore                  # Git ignore file
├── .dockerignore              # Docker ignore file
├── Dockerfile                  # Docker configuration
├── docker-compose.yml         # Docker Compose configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Project dependencies
├── package-lock.json          # Dependency lock file
├── README.md                  # This file
└── START_HERE.md              # Quick start guide
```

---

## 🚀 Deployment

### Deploy to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Connect GitHub Repository**
   - Create new project
   - Select "Deploy from GitHub"
   - Connect this repository
   - Railway auto-detects Node.js

3. **Setup Environment Variables**
   - In Railway dashboard → Variables
   - Add `DATABASE_URL` (from Neon.tech)
   - Add `JWT_SECRET`
   - Add other env vars

4. **Deploy**
   - Push to main branch
   - Railway auto-deploys
   - Get live URL

5. **Run Migrations**
   - In Railway CLI/Shell:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Database Setup (Neon.tech)

1. Go to [neon.tech](https://neon.tech)
2. Create free PostgreSQL project
3. Copy connection string
4. Add to Railway env vars as `DATABASE_URL`

---

## 🧪 Testing

### Manual Testing with Postman

1. Import: `POSTMAN_COLLECTION.json`
2. Set `baseUrl` variable to `http://localhost:4000`
3. Test endpoints

### Test Credentials

```
ADMIN:     admin@erp.local / admin123
SALES:     sales@erp.local / sales123
WAREHOUSE: warehouse@erp.local / warehouse123
ACCOUNTS:  accounts@erp.local / accounts123
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill process
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Database Connection Error

```bash
# Check connection string in .env
DATABASE_URL="postgresql://user:pass@localhost:5432/erp_crm_db"

# Test connection
npx prisma db execute --stdin < query.sql

# Reset database
npx prisma migrate reset
```

### TypeScript Compilation Error

```bash
# Clear cache
rm -rf dist node_modules
npm install
npm run build
```

### Prisma Migration Issues

```bash
# Create new migration
npx prisma migrate dev --name "migration_name"

# Reset to clean state
npx prisma migrate reset

# View database GUI
npx prisma studio
```

---

## 📋 API Response Format

### Success Response
```json
{
  "data": { /* entity or array */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "error_code",
  "message": "Human readable error",
  "details": { /* validation errors */ }
}
```

### Pagination Response
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token expiry (7 days default)
- ✅ CORS configuration
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ RBAC enforcement on all protected routes
- ✅ Environment variable security

---

## 📈 Performance

- **Database Indexes** on frequently queried fields
- **Pagination** to prevent large data transfers
- **Connection Pooling** via Prisma
- **Atomic Transactions** for data consistency
- **Query Optimization** with Prisma select

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is part of a case study assignment. Unauthorized commercial use is prohibited.

---

## 📞 Support

For issues or questions:
1. Check this README
2. See `TROUBLESHOOTING.md`
3. Open a GitHub issue
4. Contact the development team

---

## 🎯 Next Steps

- ✅ [Backend README](#) - You are here
- → [Frontend README](../frontend/README.md)
- → [API Documentation](./POSTMAN_COLLECTION.json)
- → [Deployment Guide](./DEPLOYMENT_SETUP.md)
- → [Architecture Documentation](../ARCHITECTURE.md)

---

**Made with ❤️ for professional ERP + CRM systems**

Last Updated: August 2026
