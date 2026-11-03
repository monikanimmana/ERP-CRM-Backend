"""
SayDone Django Settings
-----------------------
Single-user demo app. No authentication — stated honestly.
CORS: allows localhost:5173/8080/3000 + *.lovable.app + *.lovableproject.com
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",          # required by DRF AnonymousUser
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    # CORS must be first
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── CORS ──────────────────────────────────────────────────────────────────────
# Hard-coded dev origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
]

# Regex for Lovable deploy URLs
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.lovable\.app$",
    r"^https://.*\.lovableproject\.com$",
]

# Extra origins from env (comma-separated)
_extra = os.environ.get("EXTRA_CORS_ORIGINS", "").strip()
if _extra:
    CORS_ALLOWED_ORIGINS += [o.strip() for o in _extra.split(",") if o.strip()]

CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_HEADERS = ["accept", "content-type", "authorization"]

# ── Django REST Framework ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],   # no auth — single demo user
    "DEFAULT_PERMISSION_CLASSES": [],        # open access
    "UNAUTHENTICATED_USER": None,            # avoids requiring django.contrib.auth
    "EXCEPTION_HANDLER": "api.exceptions.custom_exception_handler",
}

# ── LLM ───────────────────────────────────────────────────────────────────────
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "rules_fallback")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
LLM_TIMEOUT_SECONDS = 8

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "saydone@example.com")
SUMMARY_EMAIL_TO = os.environ.get("SUMMARY_EMAIL_TO", "")

# Email is considered "configured" only when SMTP credentials exist
EMAIL_CONFIGURED = bool(
    EMAIL_HOST_USER
    and EMAIL_HOST_PASSWORD
    and EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
)
