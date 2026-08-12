# 🐳 DOCKER QUICK START - Run Everything with One Command!

Great! You have Docker installed. Here's how to use it with your ERP + CRM project.

---

## 🚀 ONE COMMAND TO RUN EVERYTHING

```bash
docker-compose up --build
```

That's it! This will:
- ✅ Build backend image
- ✅ Build frontend image
- ✅ Start PostgreSQL database
- ✅ Start backend server
- ✅ Start frontend dev server
- ✅ All connected automatically

---

## ⏱️ First Time Only (Database Setup)

After running `docker-compose up --build`, in a NEW terminal run:

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed test data
docker-compose exec backend npx prisma db seed
```

Done! Your database is ready.

---

## 🌐 Access Your App

After everything starts:

```
Frontend: http://localhost:3000
Backend:  http://localhost:4000
Database: localhost:5432
```

---

## 🧪 Test Credentials

```
ADMIN:     admin@erp.local / admin123
SALES:     sales@erp.local / sales123
WAREHOUSE: warehouse@erp.local / warehouse123
ACCOUNTS:  accounts@erp.local / accounts123
```

---

## 🛑 Stop Everything

```bash
docker-compose down
```

This stops all containers but keeps data.

---

## 🧹 Clean Everything (Start Fresh)

```bash
docker-compose down -v
```

This removes everything including data. Database will be empty next time.

---

## 📋 Useful Docker Commands

### See all containers
```bash
docker-compose ps
```

### View logs
```bash
# All services
docker-compose logs

# Just backend
docker-compose logs backend

# Just frontend
docker-compose logs frontend

# Just database
docker-compose logs postgres

# Follow logs (live)
docker-compose logs -f backend
```

### Run commands in container
```bash
# In backend container
docker-compose exec backend npm run build

# In database container
docker-compose exec postgres psql -U erp_user -d erp_crm_db
```

### Rebuild images
```bash
docker-compose build
```

---

## ✅ Common Scenarios

### "I just cloned the project"
```bash
docker-compose up --build
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
# Done! Visit http://localhost:3000
```

### "I made changes to backend code"
```bash
# Changes auto-reload (if you're in dev mode)
# If not, restart:
docker-compose restart backend
```

### "I made changes to frontend code"
```bash
# Changes auto-reload (Vite hot reload)
# If not, restart:
docker-compose restart frontend
```

### "Database is corrupt or I want to start fresh"
```bash
docker-compose down -v
docker-compose up --build
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### "Port 3000 or 4000 is already in use"
Edit `docker-compose.yml` and change the port mapping:
```yaml
# Instead of: - "3000:3000"
# Use:        - "3001:3000"
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# See detailed error logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Port already in use
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill it
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Database connection error
```bash
# Check if postgres is running
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Wait a few seconds then check logs
docker-compose logs postgres
```

### Changes not reflecting
```bash
# Rebuild everything
docker-compose down
docker-compose up --build

# Or just restart
docker-compose restart
```

---

## 📊 Docker Compose Structure

```
docker-compose.yml
├─ postgres (database)
│  ├─ Port: 5432
│  ├─ Volume: postgres_data
│  └─ Health check: enabled
├─ backend (Node.js server)
│  ├─ Port: 4000
│  ├─ Depends on: postgres
│  └─ Volume: ./erp-crm-backend/src (hot reload)
└─ frontend (React dev server)
   ├─ Port: 3000
   ├─ Depends on: backend
   └─ Volume: ./frontend/src (hot reload)
```

---

## ✨ What Makes Docker Useful

- ✅ Same environment everywhere (dev/test/prod)
- ✅ One command to start everything
- ✅ Automatic dependencies
- ✅ Hot reload during development
- ✅ No installation hassles
- ✅ Easy to share with team
- ✅ Production ready

---

## 📝 Docker Files Created

```
erp-crm-backend/
├─ Dockerfile (how to build backend image)
└─ .dockerignore (what to exclude)

frontend/
├─ Dockerfile (how to build frontend image)
└─ .dockerignore (what to exclude)

Root directory/
└─ docker-compose.yml (orchestrates everything)
```

---

## 🎯 Next Steps

1. Make sure Docker Desktop is running
2. Run: `docker-compose up --build`
3. Wait for all services to start (~2 min)
4. Open: http://localhost:3000
5. Login with any credential
6. Done! Your entire app is running in Docker! 🎉

---

## 💡 Pro Tips

- Docker downloads images first time (takes ~5 min)
- Subsequent runs are much faster
- Volume mounts enable hot reload (code changes auto-update)
- Network isolation means everything communicates automatically
- `docker-compose ps` shows what's running
- `docker-compose logs -f` shows live logs

---

## 🚀 Deploy with Docker

When you're ready to deploy:

1. Push Docker images to Docker Hub
2. Use in production with proper env vars
3. Scale with Kubernetes if needed

For now, just use locally to test everything! 🐳

---

**Ready? Run:** `docker-compose up --build`
