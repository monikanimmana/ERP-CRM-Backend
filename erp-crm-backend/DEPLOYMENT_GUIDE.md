# Deployment Guide — Mini ERP + CRM Operations Portal

## Overview

This guide shows how to deploy the backend, frontend, and database to production-ready platforms. All platforms offer free tiers suitable for this project.

---

## Option 1: Deploy with Render.com (Recommended for Simplicity)

Render is the easiest option for beginners. All three components can be hosted on free tier.

### Prerequisites
- GitHub account with repo pushed
- Render account (free signup at https://render.com)

### Step 1: Prepare Repository

1. **Ensure .env files are NOT committed**
   ```bash
   # Check .gitignore
   cat .gitignore
   # Should include: .env, dev.db
   ```

2. **Push to GitHub**
   ```bash
   cd erp-crm-backend
   git add .
   git commit -m "Case study submission"
   git push origin main
   ```

### Step 2: Deploy Backend to Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub repository (erp-crm-backend)
4. Fill form:
   - **Name:** `mini-erp-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Region:** Pick closest to you
5. Click "Advanced"
6. Add environment variables:
   ```
   DATABASE_URL = (from Step 3 below)
   JWT_SECRET = use_a_long_random_string_here_min_32_chars
   JWT_EXPIRES_IN = 7d
   PORT = 10000
   NODE_ENV = production
   FRONTEND_URL = https://mini-erp-frontend.onrender.com (from Step 4)
   ```
7. Click "Create Web Service"

**Backend URL will be:** `https://mini-erp-backend.onrender.com`

### Step 3: Deploy Database to Neon.tech

1. Go to https://neon.tech (free PostgreSQL hosting)
2. Sign up with GitHub
3. Create new project (free tier)
4. Copy connection string (looks like: `postgresql://user:password@...`)
5. Update Render backend environment variable `DATABASE_URL` with this string

### Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import GitHub repository (frontend folder)
4. Fill form:
   - **Framework Preset:** `Vite`
   - **Environment Variables:**
     ```
     VITE_API_URL = https://mini-erp-backend.onrender.com
     ```
5. Click "Deploy"

**Frontend URL will be:** `https://mini-erp-frontend.vercel.app`

### Step 5: Test Deployment

1. Open frontend URL in browser
2. Login with credentials:
   ```
   Email: sales@erp.local
   Password: sales123
   ```
3. Verify data loads from backend

---

## Option 2: Deploy with Railway.app

### Prerequisites
- GitHub account
- Railway account (free signup at https://railway.app)

### Backend Deployment

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose erp-crm-backend repo
5. Add environment variables (same as Render above)
6. Deploy

### Database Deployment

1. In Railway dashboard, "New" → "Database" → "PostgreSQL"
2. Copy connection string
3. Update backend environment variable

### Frontend Deployment

1. Add frontend folder as separate Railway project
2. Set `VITE_API_URL` environment variable
3. Deploy

---

## Option 3: Deploy with Fly.io

### Prerequisites
- GitHub account
- Fly CLI installed locally (https://fly.io/docs/hands-on/install-flyctl/)

### Backend Deployment

```bash
cd erp-crm-backend

# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create app
flyctl launch --name mini-erp-backend

# Add database
flyctl postgres create --name mini-erp-db

# Set environment variables
flyctl secrets set JWT_SECRET="long_random_string"
flyctl secrets set JWT_EXPIRES_IN="7d"
flyctl secrets set NODE_ENV="production"

# Deploy
flyctl deploy
```

### Frontend Deployment

```bash
cd frontend

flyctl launch --name mini-erp-frontend

# Set environment variable
flyctl secrets set VITE_API_URL="https://mini-erp-backend.fly.dev"

flyctl deploy
```

---

## Database Migration to Cloud

### Using Neon (PostgreSQL)

1. **Create database on Neon:**
   - Sign up at https://neon.tech
   - Create project
   - Copy connection string

2. **Update local `.env` to Neon connection:**
   ```env
   DATABASE_URL="postgresql://user:password@host/database"
   ```

3. **Run migrations on cloud database:**
   ```bash
   npm run db:migrate
   ```

4. **Seed cloud database:**
   ```bash
   npm run db:seed
   ```

### Using Supabase (PostgreSQL + Auth)

1. **Create project:**
   - Sign up at https://supabase.com
   - Create new project
   - Copy PostgreSQL connection string

2. **Update environment variable in Render/Railway/Fly:**
   ```
   DATABASE_URL = (from Supabase dashboard)
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

---

## Environment Variables Checklist

### Backend Production

```env
# Database (from Neon or Supabase)
DATABASE_URL="postgresql://user:password@...

# JWT
JWT_SECRET="use-a-long-random-string-here-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=10000
NODE_ENV="production"

# Frontend URL (for CORS)
FRONTEND_URL="https://mini-erp-frontend.vercel.app"
```

### Frontend Production

```env
VITE_API_URL="https://mini-erp-backend.onrender.com"
```

---

## Post-Deployment Testing

### 1. Test Backend Health
```bash
curl https://mini-erp-backend.onrender.com/health
# Should return: { "message": "OK" }
```

### 2. Test Login
```bash
curl -X POST https://mini-erp-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@erp.local","password":"sales123"}'
# Should return JWT token
```

### 3. Test Frontend
- Open https://mini-erp-frontend.vercel.app
- Login with `sales@erp.local` / `sales123`
- Verify dashboard loads with data

---

## Troubleshooting

### Frontend Shows "Cannot reach API"

**Problem:** Frontend can't connect to backend  
**Solution:**
1. Check `VITE_API_URL` environment variable in Vercel
2. Ensure backend is running on Render/Railway
3. Check backend logs for errors

### Login Fails

**Problem:** "Invalid credentials" on production  
**Solution:**
1. Check database was seeded with `npm run db:seed`
2. Verify `DATABASE_URL` is correct
3. Check backend logs for errors

### Database Connection Error

**Problem:** "PrismaClientInitializationError"  
**Solution:**
1. Verify `DATABASE_URL` format is correct
2. Ensure database exists and is accessible
3. Check environment variables are set in hosting platform

### Slow Response Times

**Problem:** API responses take 10+ seconds  
**Solution:**
1. Check hosting platform performance metrics
2. Enable database query caching
3. Optimize N+1 queries in code
4. Upgrade to paid tier if needed

---

## Performance Optimization

### Enable Response Caching

Add to backend `src/index.ts`:

```typescript
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
```

### Optimize Database Queries

Use Prisma's `select` to only fetch needed fields:

```typescript
const customer = await prisma.customer.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
});
```

### Enable Compression

Add to backend `src/index.ts`:

```typescript
import compression from 'compression';
app.use(compression());
```

---

## Monitoring & Logs

### Render Dashboard
- Go to https://render.com/dashboard
- Click service name
- View logs in real-time

### Vercel Dashboard
- Go to https://vercel.com/dashboard
- Click project
- View build logs and function logs

### Database Logs
- **Neon:** https://console.neon.tech → Monitoring
- **Supabase:** Dashboard → Database → Logs
- **Render Postgres:** https://render.com/dashboard

---

## Rollback Plan

### If Deployment Fails

1. **For Backend:**
   - Render: Dashboard → Previous deployment → Rollback
   - Railway: Deployments tab → Select previous → Redeploy
   - Fly.io: `flyctl releases` → Select version → `flyctl releases rollback`

2. **For Frontend:**
   - Vercel: Deployments → Select previous → Redeploy
   - Netlify: Deploys → Select previous → Publish

3. **For Database:**
   - PostgreSQL backups usually auto-created
   - Contact hosting platform support

---

## Estimated Costs

| Component | Platform | Free Tier | Cost |
|-----------|----------|-----------|------|
| Backend | Render | 500 hours/month | Free |
| Frontend | Vercel | Unlimited | Free |
| Database | Neon | Free tier | Free |
| Total | - | - | **$0** |

All can run on free tier for small projects.

---

## Submission Links Template

Once deployed, fill this out:

```
GitHub Backend: https://github.com/username/erp-crm-backend
GitHub Frontend: https://github.com/username/frontend

Live Frontend: https://mini-erp-frontend.vercel.app
Live Backend: https://mini-erp-backend.onrender.com

Test Credentials:
- Email: sales@erp.local
- Password: sales123

Postman Collection: ./api.http
README: ./README.md
Architecture: ./ARCHITECTURE.md
```

---

## Need Help?

- **Render Support:** https://render.com/support
- **Vercel Support:** https://vercel.com/support
- **Neon Support:** https://neon.tech/docs
- **Railway Support:** https://railway.app/support

---

**Next Step:** Choose one deployment option above and follow the steps in order.
