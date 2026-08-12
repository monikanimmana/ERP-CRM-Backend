# Quick Start Guide

Get the backend running in 5 minutes.

## Prerequisites

- Node.js 20+, npm 11+
- PostgreSQL 12+ (local or Docker)

## Steps

### 1. Start PostgreSQL (if not already running)

**Option A: Docker**

```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

**Option B: Local Installation**

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Use PostgreSQL installer or pgAdmin
```

### 2. Create Database

```bash
createdb erp_crm_db
```

Or via psql:

```bash
psql -U postgres -c "CREATE DATABASE erp_crm_db;"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Verify `.env` has correct DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/erp_crm_db?schema=public"
JWT_SECRET="super_secret_jwt_key_change_in_production_min32chars"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
```

### 5. Run Migrations & Seed

```bash
npm run db:migrate  # Create schema
npm run db:seed     # Populate test data
```

### 6. Start Server

```bash
npm run dev
```

Expected output:

```
[timestamp] Server running on http://localhost:4000
Environment: development
```

## Test Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@erp.local","password":"sales123"}'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Sales Manager",
    "email": "sales@erp.local",
    "role": "SALES"
  }
}
```

## Test Customer List

Use the token from login:

```bash
curl -X GET http://localhost:4000/customers \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

## Try API Requests

Open `api.http` in VS Code with REST Client extension, or import into Postman and use {{token}} variable.

## Troubleshooting

| Error | Solution |
|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running — start it |
| `database "erp_crm_db" does not exist` | Create DB: `createdb erp_crm_db` |
| `relation "users" does not exist` | Run migrations: `npm run db:migrate` |
| `Missing required env variable: DATABASE_URL` | Add `DATABASE_URL` to `.env` |

## Next Steps

1. Review `/src` folder structure — each layer is self-contained
2. Read `README.md` for full API documentation
3. Explore `api.http` for all endpoints
4. Try creating/updating resources via endpoints

Happy building!
