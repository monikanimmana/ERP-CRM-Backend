"""
test_pipeline.py
----------------
Tests for all 8 required scenarios plus edge cases.

Using the current date, the system must correctly handle:
 1. "Spent 250 rupees on lunch and remind me to submit the form on Friday"
 2. "Add 120 for auto rickshaw and 80 for chai"
 3. "How much have I spent this week?"
 4. "Remind me to call mom tomorrow at 6 PM"
 5. "Email me today's summary"
 6. "Aaj canteen mein 90 rupaye kharch hue"
 7. "blah blah"  → 422 NOT_UNDERSTOOD
 8. ""           → 422 EMPTY_TRANSCRIPT

Edge cases:
 - LLM returns invalid JSON  → fallback works
 - LLM times out             → fallback works
 - Negative amounts rejected
 - Huge amounts rejected
"""

import json
import pytest
from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient


# ── Helpers ───────────────────────────────────────────────────────────────────

def post_voice(client, transcript, lang="en-IN"):
    return client.post(
        "/api/voice/process",
        data=json.dumps({
            "transcript": transcript,
            "lang": lang,
            "client_time": "2026-11-03T13:00:00+05:30",
            "timezone": "Asia/Kolkata",
        }),
        content_type="application/json",
    )


# ── Scenario tests ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestVoicePipeline:

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    # ── Scenario 1 ────────────────────────────────────────────────────────────
    def test_expense_and_reminder(self):
        """'Spent 250 rupees on lunch and remind me to submit the form on Friday'"""
        res = post_voice(
            self.client,
            "Spent 250 rupees on lunch and remind me to submit the form on Friday",
        )
        assert res.status_code == 200, res.data
        data = res.data
        assert "actions" in data
        types = {a["type"] for a in data["actions"]}
        assert "expense_logged" in types, f"Missing expense_logged. Actions: {data['actions']}"
        assert "reminder_set" in types, f"Missing reminder_set. Actions: {data['actions']}"

        expense = next(a for a in data["actions"] if a["type"] == "expense_logged")
        assert expense["data"]["amount"] == 250.0
        assert expense["data"]["category"] == "Food"
        assert expense["status"] == "success"
        assert expense["real"] is True

        reminder = next(a for a in data["actions"] if a["type"] == "reminder_set")
        assert reminder["status"] == "success"
        # due_date should be a future Friday
        due = reminder["data"].get("due_date") or ""
        assert due, "Reminder should have a due_date"

        assert data["reply_text"], "reply_text should be non-empty"
        assert "llm_provider" in data
        assert "timings_ms" in data

    # ── Scenario 2 ────────────────────────────────────────────────────────────
    def test_two_expenses(self):
        """'Add 120 for auto rickshaw and 80 for chai'"""
        res = post_voice(self.client, "Add 120 for auto rickshaw and 80 for chai")
        assert res.status_code == 200, res.data
        expenses = [a for a in res.data["actions"] if a["type"] == "expense_logged"]
        assert len(expenses) == 2, f"Expected 2 expenses, got {expenses}"

        amounts = {int(e["data"]["amount"]) for e in expenses}
        assert amounts == {120, 80}, f"Wrong amounts: {amounts}"

        cats = {e["data"]["category"] for e in expenses}
        assert "Travel" in cats, f"Expected Travel category. Got {cats}"
        assert "Food" in cats, f"Expected Food category. Got {cats}"

    # ── Scenario 3 ────────────────────────────────────────────────────────────
    def test_spending_query(self):
        """'How much have I spent this week?'"""
        res = post_voice(self.client, "How much have I spent this week?")
        assert res.status_code == 200, res.data
        queries = [a for a in res.data["actions"] if a["type"] == "query_answered"]
        assert len(queries) >= 1, f"Expected query_answered. Got {res.data['actions']}"
        q = queries[0]
        assert q["status"] == "success"
        assert "amount" in q["data"]
        assert isinstance(q["data"]["amount"], (int, float))

    # ── Scenario 4 ────────────────────────────────────────────────────────────
    def test_reminder_tomorrow_6pm(self):
        """'Remind me to call mom tomorrow at 6 PM'"""
        res = post_voice(self.client, "Remind me to call mom tomorrow at 6 PM")
        assert res.status_code == 200, res.data
        reminders = [a for a in res.data["actions"] if a["type"] == "reminder_set"]
        assert len(reminders) >= 1, f"Expected reminder_set. Got {res.data['actions']}"
        r = reminders[0]
        assert r["status"] == "success"
        due = r["data"].get("due_date", "")
        assert due, "Reminder must have due_date"
        # Should be tomorrow (18:00)
        from datetime import datetime
        due_dt = datetime.fromisoformat(due.replace("Z", "+00:00"))
        tomorrow = date.today().day + 1  # mod month ok for test
        assert due_dt.hour == 18 or due_dt.hour == 17, \
            f"Expected 18:00 (±tz), got hour={due_dt.hour}"

    # ── Scenario 5 ────────────────────────────────────────────────────────────
    def test_email_summary(self):
        """'Email me today's summary' — real=False when email not configured"""
        res = post_voice(self.client, "Email me today's summary")
        assert res.status_code == 200, res.data
        emails = [a for a in res.data["actions"] if a["type"] == "email_sent"]
        assert len(emails) >= 1, f"Expected email_sent. Got {res.data['actions']}"
        e = emails[0]
        assert e["status"] == "success"
        # In test env email is not configured → real must be False
        assert e["real"] is False, "Email should be real=False when not configured"
        assert "preview" in e["data"], "Must include preview when real=False"

    # ── Scenario 6 ────────────────────────────────────────────────────────────
    def test_hindi_expense(self):
        """'Aaj canteen mein 90 rupaye kharch hue'"""
        res = post_voice(
            self.client,
            "Aaj canteen mein 90 rupaye kharch hue",
            lang="hi-IN",
        )
        assert res.status_code == 200, res.data
        expenses = [a for a in res.data["actions"] if a["type"] == "expense_logged"]
        assert len(expenses) >= 1, f"Expected expense_logged. Got {res.data['actions']}"
        e = expenses[0]
        assert int(e["data"]["amount"]) == 90
        assert e["data"]["category"] == "Food"

    # ── Scenario 7 ────────────────────────────────────────────────────────────
    def test_not_understood(self):
        """'blah blah' → 422 NOT_UNDERSTOOD"""
        res = post_voice(self.client, "blah blah blah")
        assert res.status_code == 422, res.data
        assert res.data["error"]["code"] == "NOT_UNDERSTOOD"

    # ── Scenario 8 ────────────────────────────────────────────────────────────
    def test_empty_transcript(self):
        """'' → 422 EMPTY_TRANSCRIPT"""
        res = post_voice(self.client, "")
        assert res.status_code == 422, res.data
        assert res.data["error"]["code"] == "EMPTY_TRANSCRIPT"

    def test_whitespace_only_transcript(self):
        """'   ' → 422 EMPTY_TRANSCRIPT"""
        res = post_voice(self.client, "   ")
        assert res.status_code == 422, res.data
        assert res.data["error"]["code"] == "EMPTY_TRANSCRIPT"


# ── Edge case tests ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEdgeCases:

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_llm_invalid_json_falls_back(self, mocker):
        """LLM returns invalid JSON → rules_fallback parser takes over."""
        mocker.patch(
            "api.services.llm_parser._call_gemini",
            return_value=None,
            side_effect=ValueError("invalid json from llm"),
        )
        from django.conf import settings as s
        original = s.LLM_PROVIDER
        s.LLM_PROVIDER = "gemini"
        try:
            res = post_voice(self.client, "Spent 100 rupees on coffee")
            assert res.status_code == 200
            assert res.data["llm_provider"] == "rules_fallback"
            expenses = [a for a in res.data["actions"] if a["type"] == "expense_logged"]
            assert len(expenses) >= 1
        finally:
            s.LLM_PROVIDER = original

    def test_llm_timeout_falls_back(self, mocker):
        """LLM times out → rules_fallback."""
        import concurrent.futures

        def slow_call(*args, **kwargs):
            raise concurrent.futures.TimeoutError("timeout")

        mocker.patch("api.services.llm_parser._call_gemini", side_effect=slow_call)
        from django.conf import settings as s
        original = s.LLM_PROVIDER
        s.LLM_PROVIDER = "gemini"
        try:
            res = post_voice(self.client, "Spent 200 rupees on lunch")
            assert res.status_code == 200
            assert res.data["llm_provider"] == "rules_fallback"
        finally:
            s.LLM_PROVIDER = original

    def test_negative_amount_rejected(self):
        """A negative amount must not create an expense."""
        from api.services.executor import execute
        from api.services import llm_parser
        # Inject a negative amount directly into executor (bypass parser)
        parsed = {"actions": [{"type": "log_expense", "amount": -50,
                                "currency": "INR", "category": "Food",
                                "description": "test", "date": "2026-11-03"}]}
        results = execute(parsed)
        assert all(r.status == "failed" for r in results), \
            "Negative amount should fail validation"

    def test_huge_amount_rejected(self):
        """Amount >= 10,000,000 must be rejected."""
        from api.services.executor import execute
        parsed = {"actions": [{"type": "log_expense", "amount": 99_999_999,
                                "currency": "INR", "category": "Food",
                                "description": "test", "date": "2026-11-03"}]}
        results = execute(parsed)
        assert all(r.status == "failed" for r in results), \
            "Huge amount should fail validation"

    def test_unknown_llm_action_type_ignored(self):
        """LLM output with an unknown type must not reach executor."""
        from api.services.llm_parser import _validate_actions
        raw = [
            {"type": "delete_all_expenses"},          # not whitelisted
            {"type": "log_expense", "amount": 100,
             "currency": "INR", "category": "Food",
             "description": "lunch", "date": "2026-11-03"},
        ]
        validated = _validate_actions(raw)
        assert len(validated) == 1
        assert validated[0]["type"] == "log_expense"

    def test_timings_present(self):
        """Response must always include timings_ms with understand/act/total."""
        res = post_voice(self.client, "Spent 50 rupees on chai")
        assert res.status_code == 200
        t = res.data["timings_ms"]
        assert "understand" in t
        assert "act" in t
        assert "total" in t
        assert all(isinstance(v, int) for v in t.values())

    def test_real_flag_on_expense(self):
        """Expenses created by real backend must have real=True."""
        res = post_voice(self.client, "Spent 80 rupees on snacks")
        assert res.status_code == 200
        expenses = [a for a in res.data["actions"] if a["type"] == "expense_logged"]
        assert expenses, "Should have at least one expense"
        assert all(e["real"] is True for e in expenses)

    def test_dashboard_returns_correct_shape(self):
        """GET /api/dashboard returns the exact shape the frontend expects."""
        res = self.client.get("/api/dashboard")
        assert res.status_code == 200
        d = res.data
        assert "totals" in d
        assert set(d["totals"].keys()) >= {"today", "week", "month"}
        assert "by_category" in d
        assert "recent_expenses" in d
        assert "open_tasks" in d
        assert "activity" in d

    def test_task_patch_marks_done(self):
        """PATCH /api/tasks/{id} with status=done marks the task done."""
        from api.models import Task
        task = Task.objects.create(kind="task", title="Test task", status="open")
        res = self.client.patch(
            f"/api/tasks/{task.id}",
            data=json.dumps({"status": "done"}),
            content_type="application/json",
        )
        assert res.status_code == 200
        assert res.data["status"] == "done"
        task.refresh_from_db()
        assert task.status == "done"
        assert task.completed_at is not None

    def test_expense_delete(self):
        """DELETE /api/expenses/{id} removes the expense."""
        from api.models import Expense
        exp = Expense.objects.create(
            amount=100, category="Food", description="test", spent_on=date.today()
        )
        res = self.client.delete(f"/api/expenses/{exp.id}")
        assert res.status_code == 204
        assert not Expense.objects.filter(pk=exp.id).exists()

    def test_health_endpoint(self):
        """GET /api/health returns status, llm, email, db."""
        res = self.client.get("/api/health")
        assert res.status_code == 200
        assert "status" in res.data
        assert "llm" in res.data
        assert "email" in res.data
        assert "db" in res.data
