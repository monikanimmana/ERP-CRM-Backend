"""
Reply Builder
-------------
Principle 3: reply_text is built by the BACKEND from real execution
             results, never by the LLM. So the app can only claim what
             actually happened.

Rules:
  - Under 25 words (spoken aloud)
  - Composed from action results only
  - Partial failure acknowledged ("I saved the expense, but couldn't send the email")
  - Hindi reply when lang = "hi-IN"
"""

from .executor import ActionResult


def _en_reply(results: list[ActionResult]) -> str:
    success = [r for r in results if r.status == "success"]
    failed = [r for r in results if r.status == "failed"]

    parts: list[str] = []

    # Summarise successes by type
    expenses = [r for r in success if r.type == "expense_logged"]
    tasks = [r for r in success if r.type == "task_created"]
    reminders = [r for r in success if r.type == "reminder_set"]
    emails = [r for r in success if r.type == "email_sent"]
    queries = [r for r in success if r.type == "query_answered"]

    if expenses:
        if len(expenses) == 1:
            parts.append(f"Saved {expenses[0].summary}.")
        else:
            total = sum(r.data.get("amount", 0) for r in expenses)
            parts.append(f"Saved {len(expenses)} expenses — Rs {int(total)} total.")

    for r in tasks:
        parts.append(f"Task added: {r.summary}.")

    for r in reminders:
        parts.append(f"Reminder set — {r.summary}.")

    for r in emails:
        if r.real:
            parts.append("Summary email sent!")
        else:
            parts.append("Summary ready. Email not configured, showing preview.")

    for r in queries:
        ans = r.data.get("answer", r.summary)
        parts.append(ans)

    if failed and not success:
        # Everything failed
        return "Sorry, I couldn't do that. Please try again."

    if failed and success:
        failed_labels = [r.type.replace("_", " ") for r in failed]
        parts.append(f"But I couldn't: {', '.join(set(failed_labels))}.")

    reply = " ".join(parts).strip()
    if not reply:
        return "Done!"

    # Trim to ~25 words
    words = reply.split()
    if len(words) > 28:
        reply = " ".join(words[:25]) + "…"

    return reply


def _hi_reply(results: list[ActionResult]) -> str:
    success = [r for r in results if r.status == "success"]
    failed = [r for r in results if r.status == "failed"]

    parts: list[str] = []

    expenses = [r for r in success if r.type == "expense_logged"]
    queries = [r for r in success if r.type == "query_answered"]
    reminders = [r for r in success if r.type == "reminder_set"]

    if expenses:
        if len(expenses) == 1:
            amt = expenses[0].data.get("amount", 0)
            parts.append(f"Rs {int(amt)} save kar liya.")
        else:
            total = sum(r.data.get("amount", 0) for r in expenses)
            parts.append(f"{len(expenses)} expenses save kiye — total Rs {int(total)}.")

    for r in reminders:
        parts.append(f"Reminder set: {r.summary}.")

    for r in queries:
        amt = r.data.get("amount", 0)
        period_map = {"today": "aaj", "this week": "is hafte", "this month": "is mahine"}
        period = r.data.get("period", "today")
        hindi_period = period_map.get(period, period)
        parts.append(f"Aapne {hindi_period} Rs {int(amt)} kharch kiye.")

    if failed and not success:
        return "Maafi chahta hoon, kuch galat ho gaya. Phir se try karein."

    if not parts:
        return "Ho gaya!"

    return " ".join(parts)


def build(results: list[ActionResult], lang: str = "en-IN") -> str:
    if lang == "hi-IN":
        return _hi_reply(results)
    return _en_reply(results)
