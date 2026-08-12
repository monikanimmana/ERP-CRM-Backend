# 🚀 DEPLOYMENT GUIDE - Make Your App LIVE

This guide shows how to deploy the entire ERP + CRM system to live hosting with free tier services.

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LIVE DEPLOYMENT                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend              Backend              Database    │
│  ┌─────────────┐      ┌──────────┐       ┌──────────┐  │
│  │  Vercel     │      │ Railway  │       │ Neon.tech│  │
│  │ (React App) │─────▶│ (Node.js)│──────▶│(Postgres)│  │
│  │             │      │          │       │          │  │
│  └─────────────┘      └──────────┘       └──────────┘  │
│       ▲                    ▲                    ▲       │
│       │                    │                    │       │
│   vercel.com          railway.app           neon.tech  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# 📝 STEP-BY-STEP DEPLOYMENT

## **PHASE 1: Database Setup (Neon.tech)**

### 1.1 Create Neon Account
1. Go to **https://neon.tech**
2. Click **"Sign Up"**
3. Register with GitHub or Email
4. Create a free project

### 1.2 Create PostgreSQL Database
1. After signup, create a new project
2. Name it: `erp-crm-db`
3. Note the connection string:
   ```
   postgresql://USERNAME:PASSWORD@HOST/erp-crm-db
   ```
4. **Copy this entire string** - you'll need it later

### 1.3 Get Your Connection String
- Click "Connection string" 
- Copy the full PostgreSQL URL
- Save it somewhere safe

---

## **PHASE 2: Backend Deployment (Railway.app)**

### 2.1 Prepare Backend for Production

#### Step 1: Update prisma/schema.prisma
Change the provider from SQLite to PostgreSQL:

```prisma
// BEFORE:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// AFTER:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Step 2: Update .env.example
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/erp-crm-db"
JWT_SECRET="use_a_long_random_string_min_32_chars"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.vercel.app"
```

#### Step 3: Create Production Script in package.json
Make sure these scripts exist:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

#### Step 4: Git Setup (Required for Deployment)
If not already done:
```bash
cd erp-crm-backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/YOUR_USERNAME/erp-crm-backend.git
git push -u origin main
```

### 2.2 Deploy to Railway

1. Go to **https://railway.app**
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub"**
5. Connect your GitHub account
6. Select `erp-crm-backend` repository
7. Click **"Deploy"**

### 2.3 Configure Environment Variables in Railway

1. In Railway dashboard, go to your project
2. Click **"Variables"**
3. Add these environment variables:
   ```
   DATABASE_URL = postgresql://USERNAME:PASSWORD@HOST/erp-crm-db
   JWT_SECRET = your_long_random_secret_string_here
   JWT_EXPIRES_IN = 7d
   NODE_ENV = production
   FRONTEND_URL = https://your-frontend.vercel.app
   PORT = 4000
   ```

### 2.4 Run Database Migration on Railway

1. In Railway, go to **"Deployments"**
2. Click your active deployment
3. Open **"CLI"** or **"Shell"**
4. Run migration:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### 2.5 Get Your Backend URL

- In Railway dashboard, your project will have a public URL
- It looks like: `https://erp-crm-backend-production-1234.up.railway.app`
- **Save this URL** - you'll need it for frontend

---

## **PHASE 3: Frontend Deployment (Vercel)**

### 3.1 Prepare Frontend for Production

#### Step 1: Update API URL
Edit `frontend/src/api.ts`:

```typescript
// BEFORE:
const API_URL = 'http://localhost:4000';

// AFTER:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
```

#### Step 2: Create .env.production file
In `frontend/` directory, create `.env.production`:

```env
VITE_API_URL=https://your-backend-url.railway.app
```

#### Step 3: Update vite.config.ts
Make sure your Vite config is production-ready:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
```

#### Step 4: Git Setup for Frontend
```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/YOUR_USERNAME/erp-crm-frontend.git
git push -u origin main
```

### 3.2 Deploy to Vercel

1. Go to **https://vercel.com**
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import your `frontend` repository
5. Configure:
   - **Framework**: React
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   - `VITE_API_URL` = `https://your-backend-url.railway.app`
7. Click **"Deploy"**

### 3.3 Get Your Frontend URL

- After deployment, Vercel gives you a live URL
- It looks like: `https://erp-crm-frontend.vercel.app`
- This is your public app!

---

## **PHASE 4: Connect Everything**

### 4.1 Update Backend CORS and Frontend URL

1. Go to **Railway** → your backend project
2. Update `FRONTEND_URL` variable:
   ```
   FRONTEND_URL = https://your-frontend.vercel.app
   ```
3. Redeploy backend

### 4.2 Update Frontend API URL

1. In Vercel, update environment variable:
   ```
   VITE_API_URL = https://your-backend.railway.app
   ```
2. Redeploy frontend

---

## ✅ **FINAL LIVE LINKS**

After deployment, you'll have:

### **Frontend Link (Public)**
```
https://erp-crm-frontend.vercel.app
```

### **Backend API Link (For Frontend)**
```
https://your-backend-production.railway.app
```

### **Access Your App**
1. Open frontend link in browser
2. Login with any credential:
   - Email: `admin@erp.local`
   - Password: `admin123`
3. Done! Your app is live! 🎉

---

## 📋 Test Credentials (Same Everywhere)

```
👨‍💼 ADMIN
   Email: admin@erp.local
   Password: admin123

👨‍💻 SALES
   Email: sales@erp.local
   Password: sales123

📦 WAREHOUSE
   Email: warehouse@erp.local
   Password: warehouse123

📊 ACCOUNTS
   Email: accounts@erp.local
   Password: accounts123
```

---

## 🔐 Important Security Notes

### Environment Variables - NEVER Commit These!
```
# ❌ WRONG - Don't commit .env files
.env
.env.local
.env.production

# ✅ RIGHT - Add to .gitignore
```

### JWT Secret
- Generate a strong secret: `openssl rand -base64 32`
- Use different secrets for dev and production
- Never use the same secret across environments

### CORS
- Frontend URL must be added to backend CORS config
- Never allow `*` in production (unless API is public-only)

---

## 🚀 Quick Summary

| Service | Purpose | Sign Up Link |
|---------|---------|--------------|
| **Neon.tech** | PostgreSQL Database | https://neon.tech |
| **Railway.app** | Backend (Node.js) | https://railway.app |
| **Vercel.com** | Frontend (React) | https://vercel.com |

**Total Time:** ~15-20 minutes  
**Cost:** FREE (all services have free tier)

---

## ❓ Troubleshooting

### Backend won't start
- Check environment variables in Railway
- Run migrations: `npx prisma migrate deploy`
- Check logs in Railway dashboard

### Frontend can't reach backend
- Verify `VITE_API_URL` is correct in Vercel
- Check CORS settings in backend
- Ensure backend URL is accessible

### Database connection error
- Verify PostgreSQL connection string is correct
- Check Neon.tech credentials
- Make sure database exists

---

## 📞 Support

- **Railway Support**: https://support.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs

---

**You're now ready to go LIVE!** 🎉✨
