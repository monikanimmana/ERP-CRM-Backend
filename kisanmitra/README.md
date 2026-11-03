# KisanMitra — Empowering Solutions for Farmers

A comprehensive voice-first platform designed for farmers to manage expenses, tasks, reminders, and get instant insights through natural language processing.

## Project Structure

```
kisanmitra/
├── frontend/          # React + TypeScript voice UI
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── backend/           # Django REST API
    ├── api/
    ├── config/
    ├── manage.py
    └── requirements.txt
```

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # → http://localhost:5173
```

## Features

### Voice-First Interface
- Real-time speech recognition (English & Hindi)
- Live transcript display
- Text-to-speech responses
- Microphone level visualization

### Action Pipeline
- **Voice In** → Listen and transcribe
- **Understanding** → AI processes intent
- **Acting** → Perform actions
- **Voice Out** → Speak confirmation

### Core Features
- 🌾 **Expense Tracking** - Log spending with categories
- ✓ **Task Management** - Create and track tasks
- 🔔 **Reminders** - Set time-based reminders
- 📊 **Dashboard** - View spending analytics
- 📧 **Email Summaries** - Get daily/weekly reports
- 🎤 **100% Voice Controlled** - Hands-free operation

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/voice/process` | Process voice command |
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/health` | Health check |

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (fast builds)
- Web Speech API (voice recognition)
- Web Audio API (mic level)
- Recharts (analytics)
- Lucide React (icons)

### Backend
- Django REST Framework
- Python 3.9+
- SQLite/PostgreSQL
- JWT Authentication
- Voice Processing Integration

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## Demo Mode

The frontend includes a built-in demo mode with mock data and no backend required. Toggle "Demo ON/OFF" in the top bar to switch between real backend and simulated mode.

## Development

### Make Changes
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && python manage.py runserver
```

### Run Tests
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run test
```

### Build for Production
```bash
# Frontend
cd frontend && npm run build
# Output: dist/

# Backend
cd backend && gunicorn config.wsgi
```

## Contributing

1. Create a feature branch
2. Make your changes with clear comments
3. Commit with meaningful messages
4. Push and create a PR

## Deployment

See deployment guides in `/docs` for:
- Docker setup
- AWS deployment
- GitHub Actions CI/CD
- Database migrations

---

**Built with ❤️ for Indian farmers**
