"""
SayDone API Views
-----------------
All endpoints the frontend calls. Every response shape matches the
TypeScript contract in src/types/contract.ts exactly.

Priority 1 endpoint: POST /api/voice/process — the core pipeline.
"""

import time
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Sum
from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Expense, Task, VoiceRequest
from .serializers import ExpenseSerializer, TaskSerializer, ActivityEntrySerializer
from .services import llm_parser, executor, reply_builder


# ── POST /api/voice/process ───────────────────────────────────────────────────

@api_view(["POST"])
def voice_process(request):
    """
    Core pipeline:
      1. Validate input
      2. LLM parse (with fallback to rules)
      3. Execute each action
      4. Save VoiceRequest with results
      5. Build reply_text from REAL results only (Principle 3)
      6. Return full response
    """
    t_start = time.monotonic()

    transcript = (request.data.get("transcript") or "").strip()
    lang = request.data.get("lang", "en-IN")
    timezone_str = request.data.get("timezone", "Asia/Kolkata")

    if not transcript:
        return Response(
            {"error": {"code": "EMPTY_TRANSCRIPT", "message": "Transcript is empty."}},
            status=422,
        )

    # ── Parse ────────────────────────────────────────────────────────────────
    t_parse_start = time.monotonic()
    parsed, provider = llm_parser.parse(transcript, timezone=timezone_str)
    t_parse_ms = int((time.monotonic() - t_parse_start) * 1000)

    # If only "unknown" actions → 422 NOT_UNDERSTOOD
    actions_list = parsed.get("actions", [])
    all_unknown = all(a.get("type") == "unknown" for a in actions_list)
    if not actions_list or all_unknown:
        first_reason = (actions_list[0].get("reason") if actions_list
                        else "I didn't understand that")
        return Response(
            {"error": {"code": "NOT_UNDERSTOOD", "message": first_reason}},
            status=422,
        )

    # ── Execute ──────────────────────────────────────────────────────────────
    t_act_start = time.monotonic()

    # Create a VoiceRequest record first so we can FK from expenses/tasks
    vr = VoiceRequest.objects.create(
        transcript=transcript,
        lang=lang,
        parsed_json=parsed,
        llm_provider=provider,
    )

    results = executor.execute(parsed, voice_request=vr)
    t_act_ms = int((time.monotonic() - t_act_start) * 1000)
    t_total_ms = int((time.monotonic() - t_start) * 1000)

    # ── Build reply ──────────────────────────────────────────────────────────
    reply_text = reply_builder.build(results, lang=lang)

    # ── Serialise results ────────────────────────────────────────────────────
    actions_out = [r.to_dict() for r in results]

    # Save results back to VoiceRequest for the activity timeline
    vr.results = actions_out
    vr.timings = {"understand": t_parse_ms, "act": t_act_ms, "total": t_total_ms}
    vr.llm_provider = provider
    vr.save()

    return Response({
        "transcript": transcript,
        "reply_text": reply_text,
        "actions": actions_out,
        "timings_ms": {"understand": t_parse_ms, "act": t_act_ms, "total": t_total_ms},
        "llm_provider": provider,
    })


# ── GET /api/dashboard ────────────────────────────────────────────────────────

@api_view(["GET"])
def dashboard(request):
    today = date.today()
    week_start = today - timedelta(days=7)
    month_start = today.replace(day=1)

    totals = {
        "today": float(
            Expense.objects.filter(spent_on=today)
            .aggregate(t=Sum("amount"))["t"] or 0
        ),
        "week": float(
            Expense.objects.filter(spent_on__gte=week_start)
            .aggregate(t=Sum("amount"))["t"] or 0
        ),
        "month": float(
            Expense.objects.filter(spent_on__gte=month_start)
            .aggregate(t=Sum("amount"))["t"] or 0
        ),
    }

    # Category breakdown (all time to keep chart interesting in demo)
    by_category_qs = (
        Expense.objects.values("category")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    by_category = [
        {"category": row["category"], "total": float(row["total"])}
        for row in by_category_qs
    ]

    recent_expenses = ExpenseSerializer(
        Expense.objects.all()[:20], many=True
    ).data

    open_tasks = TaskSerializer(
        Task.objects.filter(status="open"), many=True
    ).data

    activity = ActivityEntrySerializer(
        VoiceRequest.objects.all()[:20], many=True
    ).data

    return Response({
        "totals": totals,
        "by_category": by_category,
        "recent_expenses": recent_expenses,
        "open_tasks": open_tasks,
        "activity": activity,
    })


# ── GET /api/expenses ─────────────────────────────────────────────────────────

@api_view(["GET"])
def expense_list(request):
    limit = int(request.query_params.get("limit", 20))
    qs = Expense.objects.all()[:limit]
    return Response(ExpenseSerializer(qs, many=True).data)


# ── DELETE /api/expenses/{id} ─────────────────────────────────────────────────

@api_view(["DELETE"])
def expense_detail(request, pk):
    try:
        expense = Expense.objects.get(pk=pk)
    except Expense.DoesNotExist:
        return Response({"error": {"code": "NOT_FOUND", "message": "Expense not found"}}, status=404)
    expense.delete()
    return Response(status=204)


# ── GET /api/tasks ────────────────────────────────────────────────────────────

@api_view(["GET"])
def task_list(request):
    status_filter = request.query_params.get("status", "open")
    qs = Task.objects.filter(status=status_filter)
    return Response(TaskSerializer(qs, many=True).data)


# ── PATCH /api/tasks/{id} ─────────────────────────────────────────────────────

@api_view(["PATCH", "DELETE"])
def task_detail(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({"error": {"code": "NOT_FOUND", "message": "Task not found"}}, status=404)

    if request.method == "DELETE":
        task.delete()
        return Response(status=204)

    # PATCH
    new_status = request.data.get("status")
    if new_status not in ("open", "done"):
        return Response({"error": {"code": "BAD_REQUEST", "message": "status must be open|done"}}, status=400)

    task.status = new_status
    if new_status == "done":
        task.completed_at = dj_timezone.now()
    task.save()
    return Response(TaskSerializer(task).data)


# ── POST /api/demo/reset ──────────────────────────────────────────────────────

@api_view(["POST"])
def demo_reset(request):
    """Wipe all data and reseed with realistic demo data."""
    from django.core.management import call_command
    Expense.objects.all().delete()
    Task.objects.all().delete()
    VoiceRequest.objects.all().delete()
    call_command("seed_demo", verbosity=0)
    return Response({"status": "reset", "message": "Demo data reseeded."})


# ── GET /api/health ───────────────────────────────────────────────────────────

@api_view(["GET"])
def health(request):
    from django.db import connection
    db_ok = "ok"
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = "error"

    llm_provider = getattr(settings, "LLM_PROVIDER", "rules_fallback")
    llm_status = llm_provider

    email_configured = getattr(settings, "EMAIL_CONFIGURED", False)
    email_status = "configured" if email_configured else "not configured (simulated)"

    overall = "ok" if db_ok == "ok" else "degraded"

    return Response({
        "status": overall,
        "llm": llm_status,
        "email": email_status,
        "db": db_ok,
    })
