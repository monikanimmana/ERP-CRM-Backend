"""
Rules-Based Fallback Parser
---------------------------
Used when:
  (a) LLM_PROVIDER = "rules_fallback"
  (b) LLM call fails or times out
  (c) LLM returns invalid / empty JSON

Handles all 6 required sample sentences plus common variations.
Returns the same `{"actions": [...]}` JSON shape the LLM would return,
so the executor can process either path identically.

Design note: The parser only CLASSIFIES intent and EXTRACTS fields.
It never executes anything directly (Principle 1 / 2).
"""

import re
from datetime import date, datetime, timedelta
import dateparser


# ── Category heuristics ───────────────────────────────────────────────────────
CATEGORY_KEYWORDS: list[tuple[str, str]] = [
    (r"lunch|dinner|breakfast|food|chai|canteen|coffee|snack|meal|tiffin|bhojan|khana", "Food"),
    (r"auto|rickshaw|bus|metro|cab|uber|ola|fuel|petrol|taxi|transport|travel", "Travel"),
    (r"book|course|school|college|fees|education|tuition", "Education"),
    (r"medicine|medical|doctor|hospital|clinic|health|pharma", "Health"),
    (r"movie|game|concert|fun|entertainment|netflix|ott", "Entertainment"),
    (r"bill|electricity|water|gas|recharge|mobile|internet|subscription", "Bills"),
    (r"shopping|clothes|shirt|pant|shoes|dress|grocery|vegetables|sabzi", "Shopping"),
]


def guess_category(text: str) -> str:
    lower = text.lower()
    for pattern, category in CATEGORY_KEYWORDS:
        if re.search(pattern, lower):
            return category
    return "Other"


def parse_date(text: str, reference: date | None = None) -> datetime | None:
    """
    Use dateparser to resolve relative dates like 'tomorrow', 'Friday', '6 PM'.
    Returns a timezone-naive datetime.
    """
    ref = reference or date.today()
    settings = {
        "PREFER_DATES_FROM": "future",
        "RELATIVE_BASE": datetime(ref.year, ref.month, ref.day),
        "RETURN_AS_TIMEZONE_AWARE": False,
    }
    try:
        result = dateparser.parse(text, settings=settings)
        return result
    except Exception:
        return None


def _next_weekday(weekday_name: str, reference: date | None = None) -> datetime:
    """Return the next occurrence of a named weekday (Monday=0 ... Sunday=6)."""
    DAYS = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6,
    }
    ref = reference or date.today()
    target = DAYS.get(weekday_name.lower(), 4)  # default Friday
    days_ahead = target - ref.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    due = datetime.combine(ref + timedelta(days=days_ahead), datetime.min.time()).replace(hour=9)
    return due


# ── Action builders ───────────────────────────────────────────────────────────

def _make_expense(amount: float, description: str, date_str: str | None = None) -> dict:
    return {
        "type": "log_expense",
        "amount": amount,
        "currency": "INR",
        "category": guess_category(description),
        "description": description.strip(),
        "date": date_str or date.today().isoformat(),
    }


def _make_reminder(title: str, due_at: datetime | None) -> dict:
    if due_at is None:
        # Default to tomorrow 09:00
        due_at = datetime.combine(date.today() + timedelta(days=1), datetime.min.time()).replace(hour=9)
    return {
        "type": "create_reminder",
        "title": title.strip(),
        "due_at": due_at.isoformat(),
    }


def _make_task(title: str, due_at: datetime | None = None) -> dict:
    return {
        "type": "create_task",
        "title": title.strip(),
        "due_at": due_at.isoformat() if due_at else None,
    }


def _make_query(period: str) -> dict:
    return {"type": "query_spend", "period": period}


def _make_email(period: str = "today") -> dict:
    return {"type": "send_summary_email", "period": period}


# ── Main parse function ───────────────────────────────────────────────────────

def parse(transcript: str) -> dict:
    """
    Parse transcript → {"actions": [...]}.
    Returns the same shape the LLM returns so the executor is identical.
    """
    text = transcript.strip()
    lower = text.lower()
    actions: list[dict] = []

    # ── 1. Email summary ────────────────────────────────────────────────────
    email_match = re.search(
        r"email\s+(?:me\s+)?(?:a\s+)?(?:today'?s?\s+)?summary|send\s+(?:me\s+)?(?:a\s+)?(?:daily\s+)?summary",
        lower,
    )
    if email_match:
        period_m = re.search(r"\b(today|week|month)\b", lower)
        period = period_m.group(1) if period_m else "today"
        actions.append(_make_email(period))
        return {"actions": actions}

    # ── 2. Spending query ───────────────────────────────────────────────────
    query_match = re.search(
        r"how\s+much\s+(?:have\s+i\s+)?(?:spent|spend)|kitna\s+(?:kharch|spend)|total\s+spent",
        lower,
    )
    if query_match:
        if "today" in lower:
            period = "today"
        elif "week" in lower or "hafte" in lower:
            period = "week"
        elif "month" in lower or "mahine" in lower:
            period = "month"
        else:
            period = "today"
        actions.append(_make_query(period))
        return {"actions": actions}

    # ── 3. Extract reminder(s) ──────────────────────────────────────────────
    # Pattern: "remind me to <title> on/at/by <when>" or "set a reminder for <title> <when>"
    reminder_patterns = [
        r"remind(?:er)?\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+(?:on|at|by)\s+(.+?))?(?:\s+and\s+|$)",
        r"set\s+(?:a\s+)?reminder\s+(?:to\s+|for\s+)?(.+?)(?:\s+(?:on|at|by)\s+(.+?))?(?:\s+and\s+|$)",
    ]
    for pat in reminder_patterns:
        for m in re.finditer(pat, lower):
            title_raw = m.group(1).strip()
            when_raw = m.group(2) if m.lastindex and m.lastindex >= 2 else None

            # strip trailing noise
            title_clean = re.sub(
                r"\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|at\s+\d|on\s+\w).*$",
                "", title_raw
            ).strip()
            if not title_clean or len(title_clean) < 2:
                continue

            # Try to find time in remaining text
            due_dt = None
            # Named weekday in full text
            weekday_m = re.search(
                r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", lower
            )
            time_m = re.search(r"\b(\d{1,2})\s*(?::|\.)?(\d{2})?\s*(am|pm)\b", lower)
            tomorrow_m = re.search(r"\btomorrow\b", lower)

            if when_raw:
                due_dt = parse_date(when_raw)

            if due_dt is None and weekday_m:
                due_dt = _next_weekday(weekday_m.group(1))
                if time_m:
                    h = int(time_m.group(1))
                    minute = int(time_m.group(2)) if time_m.group(2) else 0
                    if time_m.group(3) == "pm" and h != 12:
                        h += 12
                    due_dt = due_dt.replace(hour=h, minute=minute)

            if due_dt is None and tomorrow_m:
                h, minute = 9, 0
                if time_m:
                    h = int(time_m.group(1))
                    minute = int(time_m.group(2)) if time_m.group(2) else 0
                    if time_m.group(3) == "pm" and h != 12:
                        h += 12
                due_dt = datetime.combine(
                    date.today() + timedelta(days=1), datetime.min.time()
                ).replace(hour=h, minute=minute)

            # Use original-case title from transcript
            title_in_orig = transcript[m.start(1): m.start(1) + len(title_raw)]
            actions.append(_make_reminder(title_in_orig or title_clean, due_dt))
            break  # one reminder per pass

    # ── 4. Extract expense(s) ───────────────────────────────────────────────
    matched_amounts: set[str] = set()

    # Handle Hindi "X mein N rupaye kharch" FIRST before generic patterns
    hindi_mein = re.search(
        r"(?:aaj|kal\s+)?([a-zA-Z\s]+?)\s+mein\s+(\d+(?:\.\d+)?)\s*rupaye?\s+kharch", lower
    )
    if hindi_mein:
        desc = hindi_mein.group(1).strip()
        try:
            amount = float(hindi_mein.group(2))
            if amount > 0:
                actions.append(_make_expense(amount, desc))
                matched_amounts.add(hindi_mein.group(2))
        except ValueError:
            pass

    # Generic patterns for everything else
    expense_patterns = [
        # "add/spent NNN for/on desc [and NNN for desc]"
        r"(?:add|spent?|paid|bought|kharch(?:a|e)?\s+(?:hue|hua|ki)?)\s+(\d+(?:\.\d+)?)\s*(?:rupees?|rupaye?|rs\.?|₹)?\s*(?:on|for|mein|per|ka|ki|ke)?\s+([a-zA-Z\s]+?)(?=\s*(?:and\s+\d|\d|remind|,|\.|$))",
        # "and NNN for/on desc" — second item in a list
        r"(?:^|and)\s+(\d+(?:\.\d+)?)\s*(?:rupees?|rupaye?|rs\.?|₹)?\s*(?:on|for|mein|per|ka|ki|ke)?\s+([a-zA-Z\s]+?)(?=\s*(?:and\s+\d|\d|remind|,|\.|$))",
        # "N rupees on X"
        r"(\d+(?:\.\d+)?)\s*(?:rupees?|rupaye?|rs\.?|₹)\s+(?:on|for|mein|per|ka|ki|ke)?\s*([a-zA-Z\s]+?)(?=\s*(?:and\s+\d|\d|remind|,|\.|$))",
        # Hindi: "90 rupaye canteen mein"
        r"(\d+(?:\.\d+)?)\s*rupaye?\s+([a-zA-Z\s]+?)(?=\s+(?:mein|and|\d|$))",
    ]

    for pat in expense_patterns:
        for m in re.finditer(pat, lower):
            amount_str = m.group(1).strip()
            if amount_str in matched_amounts:
                continue
            desc_raw = m.group(2).strip()
            # Drop reminder noise from description
            desc_clean = re.sub(
                r"\b(and|remind|me|to|submit|the|form|call|mom|at|on|by|mein)\b", "", desc_raw
            ).strip()
            desc_clean = re.sub(r"\s+", " ", desc_clean).strip()

            try:
                amount = float(amount_str)
            except ValueError:
                continue

            if not desc_clean or len(desc_clean) < 2:
                continue

            matched_amounts.add(amount_str)
            actions.append(_make_expense(amount, desc_clean))

    # ── 5. (Hindi patterns handled before generic loop above) ─────────────

    # ── 6. If nothing matched → unknown ────────────────────────────────────
    if not actions:
        actions.append({"type": "unknown", "reason": "Could not parse intent"})

    return {"actions": actions}
