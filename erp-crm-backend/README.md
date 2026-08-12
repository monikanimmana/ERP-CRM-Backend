# ERP + CRM Operations Portal

Complete full-stack application with backend and frontend in a single repository.

## 📁 Project Structure

```
erp-crm-backend/          (This Repository)
├── backend/              Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── frontend/             Frontend UI (React + Vite + TypeScript)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
└── docker-compose.yml    (Optional: Run both with Docker)
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:4000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

## 📊 Features

- ✅ Role-Based Access Control (RBAC) - 4 Roles
- ✅ Customer Management
- ✅ Product Inventory
- ✅ Sales Challans
- ✅ Stock Tracking
- ✅ JWT Authentication
- ✅ Professional UI

## 🔐 Test Credentials

```
ADMIN:     admin@erp.local / admin123
SALES:     sales@erp.local / sales123
WAREHOUSE: warehouse@erp.local / warehouse123
ACCOUNTS:  accounts@erp.local / accounts123
```

## 📚 Documentation

- **Backend README**: See `backend/README.md`
- **Frontend README**: See `frontend/README.md`
- **API Documentation**: `backend/api.http`
- **Architecture**: `backend/ARCHITECTURE.md`

## 🐳 Docker

Run both services with:
```bash
docker-compose up --build
```

## 📦 Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL / SQLite
- JWT Authentication

**Frontend:**
- React 18
- TypeScript
- Vite
- Axios

## 🔧 Environment Setup

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000
```

## 📝 License

This project is for educational purposes.

---

**Navigate to `/backend` or `/frontend` folder for detailed setup instructions.**
