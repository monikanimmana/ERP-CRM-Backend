# SayDone — Backend

Django 5 + DRF backend for the SayDone voice-first productivity app.

> **No authentication** — this is a single-user hackathon demo. State this
> honestly in any presentation.

---

## Setup in under 5 minutes

```bash
# 1. Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set LLM_PROVIDER, API keys, email if you want them
# Defaults work out of the box with LLM_PROVIDER=rules_fallback

# 4. Run migrations and seed demo data
python manage.py migrate
python manage.py seed_demo

# 5. Start the server
python manage.py runserver
```

The API is now at **http://localhost:8000**.

Point the frontend at it:
```
# In saydone/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

---

## curl Examples

```bash
BASE=http://localhost:8000

# Health check
curl $BASE/api/health

# Voice pipeline — expense + reminder
curl -X POST $BASE/api/voice/process \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Spent 250 rupees on lunch and remind me to submit the form on Friday",
    "lang": "en-IN",
    "client_time": "2026-11-03T13:00:00+05:30",
    "timezone": "Asia/Kolkata"
  }'

# Hindi expense
curl -X POST $BASE/api/voice/process \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Aaj canteen mein 90 rupaye kharch hue",
    "lang": "hi-IN",
    "client_time": "2026-11-03T13:00:00+05:30",
    "timezone": "Asia/Kolkata"
  }'

# Dashboard
curl $BASE/api/dashboard

# Mark a task done
curl -X PATCH $BASE/api/tasks/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'

# Reset demo data
curl -X POST $BASE/api/demo/reset
```

---

## What is Real vs Simulated?

Every action in the API response has a `"real": true/false` field.

| Situation | `real` | What it means |
|---|---|---|
| Expense saved to DB | `true` | Row exists in `api_expense` — you can query it |
| Task/reminder saved to DB | `true` | Row exists in `api_task` |
| Spending query answered | `true` | Aggregated from live DB data |
| Email sent via SMTP | `true` | Mail was actually delivered |
| Email, SMTP not configured | `false` | Nothing sent; `data.preview` has the text |
| LLM parse, rules fallback | — | `llm_provider: "rules_fallback"` in response |

The frontend shows a **Real** or **Simulated** chip on every action card so the
demo audience can see exactly what ran for real.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Frontend (React/Vite — localhost:5173)                            │
│  ┌─────────────┐  POST /api/voice/process                          │
│  │ useVoice    │ ─────────────────────────────────────────────┐    │
│  │ Pipeline    │                                              │    │
│  └─────────────┘                                              ▼    │
└───────────────────────────────────┐  ┌──────────────────────────┐ │
                                    │  │  Django (localhost:8000)  │ │
                                    └─▶│                          │ │
                                       │  views.voice_process()   │ │
                                       │         │                │ │
                                       │    ┌────▼─────┐          │ │
                                       │    │llm_parser│          │ │
                                       │    │ (parse)  │          │ │
                                       │    └────┬─────┘          │ │
                                       │         │ structured JSON │ │
                                       │    ┌────▼──────┐         │ │
                                       │    │ executor  │         │ │
                                       │    │(validate  │         │ │
                                       │    │+ execute) │         │ │
                                       │    └────┬──────┘         │ │
                                       │         │ ActionResult[]  │ │
                                       │    ┌────▼──────────┐     │ │
                                       │    │ reply_builder │     │ │
                                       │    │(from results  │     │ │
                                       │    │ only, no LLM) │     │ │
                                       │    └───────────────┘     │ │
                                       │                          │ │
                                       │  SQLite (db.sqlite3)     │ │
                                       └──────────────────────────┘ │
```

---

## Design Principles

These are the five core design decisions. Defend them live.

**1. The LLM only PARSES**
The LLM outputs a structured JSON list of actions like
`{"actions": [{"type": "log_expense", "amount": 250, ...}]}`.
It never runs code, touches the database, or sends email. The backend
validates and executes everything. This makes the system auditable:
you can log exactly what the LLM said vs what the backend did.

**2. Only whitelisted action types execute**
The executor has an `ACTION_REGISTRY` — a hard-coded dict mapping
type names to handler functions. Any type not in the registry is
silently dropped. Amounts must be `0 < amount < 10,000,000`. This
prevents prompt-injection attacks where a malicious transcript tries
to trigger `delete_all_expenses` or similar.

**3. reply_text is built by the backend, never the LLM**
The reply is constructed from the actual execution results —
what amounts were saved, whether the reminder was created, etc.
This means the app cannot claim something happened that didn't.
If a handler fails, the reply says so explicitly.

**4. Graceful degradation to rules fallback**
If the LLM call fails, times out (8s, one retry), or returns invalid
JSON, the request falls through to a regex-based rules parser.
The response includes `"llm_provider": "rules_fallback"` so the
frontend can surface this honestly. The demo never breaks.

**5. Honesty: `real` reflects reality**
Every action result carries `"real": true/false`. Email actions when
SMTP is not configured return `"real": false` and include a text
preview — the app shows this as "Simulated" in the UI chip, rather
than pretending the email was sent.

---

## LLM Configuration

Set `LLM_PROVIDER` in `.env`:

| Value | Requires |
|---|---|
| `rules_fallback` | Nothing — works offline, no API key |
| `gemini` | `GEMINI_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `claude` | `ANTHROPIC_API_KEY` |

The rules parser handles all 6 demo sentences. Use it for the
hackathon if you don't want to depend on an LLM API.

---

## Email Configuration

Set in `.env`:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=app-password-here
SUMMARY_EMAIL_TO=recipient@example.com
```

Without these, `email_sent` actions return `real: false` with a text
preview — clearly labelled "Simulated" in the frontend.

---

## Running Tests

```bash
pytest tests/test_pipeline.py -v
```

20 tests covering all 8 required scenarios plus edge cases:
LLM invalid JSON fallback, LLM timeout fallback, negative/huge amount
rejection, unknown action type filtering, dashboard shape, task CRUD.

---

## Smoke Test (requires curl + bash)

```bash
# Start server first
python manage.py runserver &
bash scripts/smoke_test.sh
```

---

## Frontend Wiring Notes

Set in `saydone/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

**No frontend edits needed.** One field name was reconciled during
analysis: the frontend uses `due_date` on `OpenTask`, the Django model
uses `due_at` — the serializer maps `due_at → due_date` transparently.

CORS is pre-configured for `localhost:5173`, `localhost:8080`,
`localhost:3000`, `*.lovable.app`, and `*.lovableproject.com`.
