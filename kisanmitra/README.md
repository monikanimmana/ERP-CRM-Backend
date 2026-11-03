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

## Core Features

### Voice-First Interface
- 🎤 **Real-time Speech Recognition** - English & Hindi support
- 🔊 **Text-to-Speech Responses** - Instant voice feedback
- 📊 **Live Transcripts** - See what the app understood
- 📈 **Waveform Visualization** - Real-time mic level feedback

### Smart Action Pipeline
- **Voice In** → Capture and transcribe speech (300-800ms)
- **Understanding** → AI processes intent (500-1500ms)
- **Acting** → Save to database (200-400ms)
- **Voice Out** → Speak confirmation (1-3s)

### Farmer-Focused Features
- 🌾 **Expense Tracking** - Log spending by category (Food, Transport, Medical, etc.)
- ✓ **Task Management** - Create and track daily tasks
- 🔔 **Smart Reminders** - Set reminders for important dates
- 📊 **Spending Analytics** - View expenses by category with charts
- 📧 **Daily Reports** - Get email summaries of activity
- 🌐 **Bilingual** - Fully supports English and Hindi

### Demo Mode
- Built-in mock backend with zero external dependencies
- Toggle "Demo ON/OFF" in top bar
- Full voice functionality without backend
- Seamless switch to real backend when ready

### Real vs Simulated Transparency
- Every action shows whether it's real (saved to DB) or simulated
- Frontend honestly displays state to users
- Graceful degradation when services unavailable

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/voice/process` | Process voice command → actions + reply |
| GET | `/api/dashboard` | Get dashboard metrics |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| PATCH | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| GET | `/api/tasks` | List tasks & reminders |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/{id}` | Mark task done |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/health` | Backend health check |
| POST | `/api/demo/reset` | Reset demo data (backend only) |

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

## Backend Documentation

See [backend/README.md](./backend/README.md) for:
- Django REST API setup & deployment
- LLM configuration (Gemini, OpenAI, Claude, or rules-based)
- Voice processing pipeline architecture
- Database models & migrations
- Email integration setup
- Testing & smoke tests
- curl examples for all endpoints

---

**Built with ❤️ for Indian farmers**
