"""
Action Executor
---------------
Principle 1: The executor is the ONLY place where side effects happen.
             The LLM parser just produced a list of structured dicts;
             we validate and execute them here.

Principle 3: reply_text is built by the BACKEND from real execution
             results, never by the LLM.

Architecture: an action registry maps type → handler function.
Each handler returns an ActionResult dataclass.
One handler failure does NOT break others (try/except around each call).

Handlers:
  log_expense       → save Expense → "expense_logged", real=True
  create_task       → save Task (kind=task) → "task_created", real=True
  create_reminder   → save Task (kind=reminder) → "reminder_set", real=True
  query_spend       → aggregate DB → "query_answered", real=True
  send_summary_email → SMTP if configured else preview → real=True/False
  unknown           → "query_answered" with "not understood" message
"""

import uuid
from dataclasses import dataclass, field, asdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from django.conf import settings
from django.utils import timezone as dj_timezone

from api.models import Expense, Task, VoiceRequest


@dataclass
class ActionResult:
    id: str
    type: str           # frontend action type string
    status: str         # "success" | "failed"
    real: bool
    summary: str
    data: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _new_id() -> str:
    return str(uuid.uuid4())


def _parse_date(val: Any) -> date:
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        try:
            return date.fromisoformat(val[:10])
        except ValueError:
            pass
    return date.today()


def _parse_datetime(val: Any) -> datetime | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        from django.utils import timezone as dj_tz
        return dj_tz.make_aware(val) if dj_tz.is_naive(val) else val
    if isinstance(val, str):
        try:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            from django.utils import timezone as dj_tz
            return dj_tz.make_aware(dt) if dj_tz.is_naive(dt) else dt
        except ValueError:
            pass
        try:
            dt = datetime.fromisoformat(val)
            from django.utils import timezone as dj_tz
            return dj_tz.make_aware(dt) if dj_tz.is_naive(dt) else dt
        except ValueError:
            pass
    return None


def _fmt_amount(amount: float) -> str:
    """Format amount as clean rupee string."""
    if amount == int(amount):
        return f"Rs {int(amount)}"
    return f"Rs {amount:.2f}"


# ── Handlers ──────────────────────────────────────────────────────────────────

def _handle_log_expense(action: dict, voice_request: VoiceRequest | None) -> ActionResult:
    try:
        amount = float(action["amount"])
        assert 0 < amount < 10_000_000, "Amount out of range"
        category = action.get("category", "Other")
        description = str(action.get("description", ""))[:200]
        spent_on = _parse_date(action.get("date"))

        expense = Expense.objects.create(
            amount=Decimal(str(round(amount, 2))),
            category=category,
            description=description,
            spent_on=spent_on,
            voice_request=voice_request,
        )
        return ActionResult(
            id=_new_id(),
            type="expense_logged",
            status="success",
            real=True,
            summary=f"{_fmt_amount(amount)} · {category} · {description}",
            data={
                "id": str(expense.id),
                "amount": float(expense.amount),
                "category": expense.category,
                "description": expense.description,
                "created_at": expense.created_at.isoformat(),
            },
        )
    except Exception as e:
        return ActionResult(
            id=_new_id(), type="expense_logged", status="failed",
            real=True, summary="Failed to log expense", data={"error": str(e)}
        )


def _handle_create_task(action: dict, voice_request: VoiceRequest | None) -> ActionResult:
    try:
        title = str(action.get("title", ""))[:300]
        due_at = _parse_datetime(action.get("due_at"))
        task = Task.objects.create(
            kind="task",
            title=title,
            due_at=due_at,
            voice_request=voice_request,
        )
        return ActionResult(
            id=_new_id(),
            type="task_created",
            status="success",
            real=True,
            summary=title,
            data={
                "id": str(task.id),
                "title": task.title,
                "due_date": task.due_at.isoformat() if task.due_at else None,
                "status": task.status,
                "type": "task",
                "created_at": task.created_at.isoformat(),
            },
        )
    except Exception as e:
        return ActionResult(
            id=_new_id(), type="task_created", status="failed",
            real=True, summary="Failed to create task", data={"error": str(e)}
        )


def _handle_create_reminder(action: dict, voice_request: VoiceRequest | None) -> ActionResult:
    try:
        title = str(action.get("title", ""))[:300]
        due_at = _parse_datetime(action.get("due_at"))
        if due_at is None:
            # Default tomorrow 09:00 (timezone-aware)
            from django.utils import timezone as dj_tz
            tomorrow = date.today() + timedelta(days=1)
            naive = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 9, 0)
            due_at = dj_tz.make_aware(naive)

        task = Task.objects.create(
            kind="reminder",
            title=title,
            due_at=due_at,
            voice_request=voice_request,
        )
        due_label = due_at.strftime("%a, %d %b %H:%M") if due_at else "soon"
        return ActionResult(
            id=_new_id(),
            type="reminder_set",
            status="success",
            real=True,
            summary=f"{title} · {due_label}",
            data={
                "id": str(task.id),
                "title": task.title,
                "due_date": task.due_at.isoformat() if task.due_at else None,
                "status": task.status,
                "type": "reminder",
                "created_at": task.created_at.isoformat(),
            },
        )
    except Exception as e:
        return ActionResult(
            id=_new_id(), type="reminder_set", status="failed",
            real=True, summary="Failed to set reminder", data={"error": str(e)}
        )


def _handle_query_spend(action: dict, voice_request: VoiceRequest | None) -> ActionResult:
    try:
        period = action.get("period", "today")
        category = action.get("category")

        today = date.today()
        if period == "today":
            start = today
            label = "today"
        elif period == "week":
            start = today - timedelta(days=7)
            label = "this week"
        elif period == "month":
            start = today.replace(day=1)
            label = "this month"
        else:
            start = today
            label = "today"

        qs = Expense.objects.filter(spent_on__gte=start)
        if category:
            qs = qs.filter(category__iexact=category)

        from django.db.models import Sum
        total_dec = qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
        total = float(total_dec)

        cat_note = f" on {category}" if category else ""
        return ActionResult(
            id=_new_id(),
            type="query_answered",
            status="success",
            real=True,
            summary=f"₹{int(total):,} {label}{cat_note}",
            data={
                "answer": f"You've spent ₹{int(total):,}{cat_note} {label}.",
                "amount": total,
                "period": label,
                "category": category,
            },
        )
    except Exception as e:
        return ActionResult(
            id=_new_id(), type="query_answered", status="failed",
            real=True, summary="Failed to query spend", data={"error": str(e)}
        )


def _handle_send_summary_email(action: dict, voice_request: VoiceRequest | None) -> ActionResult:
    """
    Send a spending summary email.
    If email is not configured → real=False, include HTML preview in data.
    Principle 5: never silently lie — real reflects actual send status.
    """
    from django.core.mail import send_mail
    from django.db.models import Sum

    period = action.get("period", "today")
    today = date.today()

    if period == "today":
        start = today
        label = "today"
    elif period == "week":
        start = today - timedelta(days=7)
        label = "this week"
    else:
        start = today.replace(day=1)
        label = "this month"

    expenses = Expense.objects.filter(spent_on__gte=start).order_by("-spent_on")
    total = float(expenses.aggregate(total=Sum("amount"))["total"] or 0)

    lines = [f"Your SayDone Summary — {label.title()}",
             f"Total: ₹{int(total):,}", ""]
    for e in expenses[:20]:
        lines.append(f"  • {e.description}: ₹{int(e.amount)} ({e.category}) — {e.spent_on}")
    preview = "\n".join(lines)

    to_address = settings.SUMMARY_EMAIL_TO
    email_configured = getattr(settings, "EMAIL_CONFIGURED", False)

    if email_configured and to_address:
        try:
            send_mail(
                subject=f"SayDone Summary — {label.title()}",
                message=preview,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_address],
            )
            return ActionResult(
                id=_new_id(),
                type="email_sent",
                status="success",
                real=True,
                summary=f"Summary sent to {to_address}",
                data={"to": to_address, "subject": f"SayDone Summary — {label.title()}",
                      "sent_at": datetime.utcnow().isoformat()},
            )
        except Exception as e:
            return ActionResult(
                id=_new_id(), type="email_sent", status="failed",
                real=True, summary="Email failed to send", data={"error": str(e)}
            )
    else:
        # Not configured — real=False, surface the preview
        return ActionResult(
            id=_new_id(),
            type="email_sent",
            status="success",
            real=False,  # honest: nothing was actually sent
            summary="Summary ready (email not configured)",
            data={
                "to": to_address or "not configured",
                "subject": f"SayDone Summary — {label.title()}",
                "preview": preview,
                "sent_at": datetime.now(tz=timezone.utc).isoformat(),
            },
        )


def _handle_unknown(action: dict, voice_request: VoiceRequest | None) -> ActionResult:
    reason = action.get("reason", "I didn't understand that")
    return ActionResult(
        id=_new_id(),
        type="query_answered",
        status="failed",
        real=False,
        summary=reason,
        data={"answer": reason},
    )


# ── Action registry ───────────────────────────────────────────────────────────

ACTION_REGISTRY: dict[str, Any] = {
    "log_expense": _handle_log_expense,
    "create_task": _handle_create_task,
    "create_reminder": _handle_create_reminder,
    "query_spend": _handle_query_spend,
    "send_summary_email": _handle_send_summary_email,
    "unknown": _handle_unknown,
}


# ── Public execute function ───────────────────────────────────────────────────

def execute(parsed: dict, voice_request: VoiceRequest | None = None) -> list[ActionResult]:
    """
    Execute all actions in the parsed dict.
    One handler failure does NOT abort others.
    """
    actions = parsed.get("actions", [])
    results: list[ActionResult] = []

    for action in actions:
        action_type = action.get("type", "unknown")
        handler = ACTION_REGISTRY.get(action_type, _handle_unknown)
        try:
            result = handler(action, voice_request)
        except Exception as e:
            result = ActionResult(
                id=_new_id(),
                type=action_type,
                status="failed",
                real=False,
                summary=f"Unexpected error",
                data={"error": str(e)},
            )
        results.append(result)

    return results
