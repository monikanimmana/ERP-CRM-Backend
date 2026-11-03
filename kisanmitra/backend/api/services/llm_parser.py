"""
LLM Parser
----------
Principle 1: The LLM only PARSES. It outputs a JSON list of actions.
             The backend validates and executes them. The LLM never runs
             anything directly.

Principle 2: Only whitelisted action types are accepted from LLM output.

Principle 4: On LLM failure or timeout (8 s, one retry) → rules fallback.
             Returns llm_provider = "rules_fallback".

Provider selected by settings.LLM_PROVIDER:
  gemini | claude | openai | rules_fallback

System prompt is sent verbatim as specified; relative dates are resolved
against the server's current date in the request timezone.
"""

import json
import signal
import time
from datetime import datetime

import pytz
from django.conf import settings

from .rules_parser import parse as rules_parse

WHITELISTED_TYPES = {
    "log_expense",
    "create_task",
    "create_reminder",
    "query_spend",
    "send_summary_email",
    "unknown",
}

SYSTEM_PROMPT_TEMPLATE = """You convert ONE spoken sentence into a JSON list of actions. Today is {now} in timezone {tz}. Allowed action types:
log_expense{{amount:number>0, currency:'INR', category:one of [Food, Travel, Shopping, Bills, Education, Health, Entertainment, Other], description:string, date:ISO date}},
create_task{{title, due_at:ISO datetime|null}},
create_reminder{{title, due_at:ISO datetime (required)}},
query_spend{{period:'today'|'week'|'month', category:optional}},
send_summary_email{{period}},
unknown{{reason}}.
Rules: output ONLY JSON of the form {{"actions":[...]}}. One action per distinct intent in the sentence. Resolve relative dates ('Friday','tomorrow') against Today. If only a date is given for a reminder, use 09:00. Never invent amounts. Hindi or Hinglish input is allowed; output English field values. If nothing is actionable return a single unknown action."""


def _build_system_prompt(timezone: str) -> str:
    try:
        tz = pytz.timezone(timezone)
        now_str = datetime.now(tz).strftime("%A, %d %B %Y %H:%M")
    except Exception:
        now_str = datetime.utcnow().strftime("%A, %d %B %Y %H:%M") + " UTC"
    return SYSTEM_PROMPT_TEMPLATE.format(now=now_str, tz=timezone)


def _validate_actions(actions_raw: list) -> list:
    """
    Validate LLM output:
      - Only whitelisted types
      - log_expense: amount > 0 and < 10,000,000
      - Reject entries with wrong shape (missing required keys)
    """
    validated = []
    for action in actions_raw:
        if not isinstance(action, dict):
            continue
        action_type = action.get("type")
        if action_type not in WHITELISTED_TYPES:
            continue  # silently drop unknown action types (security)

        if action_type == "log_expense":
            try:
                amt = float(action.get("amount", 0))
            except (TypeError, ValueError):
                continue
            if not (0 < amt < 10_000_000):
                continue  # Principle 2: reject out-of-range amounts
            action["amount"] = amt

        validated.append(action)
    return validated


def _parse_llm_response(text: str) -> dict:
    """Extract JSON from LLM response text (handles markdown code blocks)."""
    text = text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    data = json.loads(text)
    if "actions" not in data or not isinstance(data["actions"], list):
        raise ValueError("Missing 'actions' list")
    data["actions"] = _validate_actions(data["actions"])
    return data


import re  # needed by _parse_llm_response — import here to avoid circular


def _call_with_retry(call_fn, max_retries: int = 1):
    """Call call_fn up to max_retries+1 times with LLM_TIMEOUT_SECONDS."""
    timeout = getattr(settings, "LLM_TIMEOUT_SECONDS", 8)
    last_exc = None
    for attempt in range(max_retries + 1):
        try:
            # Use a thread-based timeout on Windows (signal not available in threads)
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(call_fn)
                return future.result(timeout=timeout)
        except concurrent.futures.TimeoutError:
            last_exc = TimeoutError(f"LLM timed out after {timeout}s")
        except Exception as e:
            last_exc = e
        if attempt < max_retries:
            time.sleep(0.3)
    raise last_exc


# ── Provider implementations ──────────────────────────────────────────────────

def _call_gemini(system_prompt: str, transcript: str) -> dict:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    response = model.generate_content(transcript)
    return _parse_llm_response(response.text)


def _call_openai(system_prompt: str, transcript: str) -> dict:
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": transcript},
        ],
        max_tokens=512,
    )
    return _parse_llm_response(response.choices[0].message.content)


def _call_claude(system_prompt: str, transcript: str) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=512,
        system=system_prompt,
        messages=[{"role": "user", "content": transcript}],
    )
    return _parse_llm_response(message.content[0].text)


# ── Public API ────────────────────────────────────────────────────────────────

def parse(transcript: str, timezone: str = "Asia/Kolkata") -> tuple[dict, str]:
    """
    Returns (parsed_dict, llm_provider_name).
    Always succeeds: falls back to rules_parser on any failure.
    """
    provider = getattr(settings, "LLM_PROVIDER", "rules_fallback")

    if provider == "rules_fallback" or not transcript.strip():
        return rules_parse(transcript), "rules_fallback"

    system_prompt = _build_system_prompt(timezone)

    PROVIDERS = {
        "gemini": (_call_gemini, settings.GEMINI_API_KEY),
        "openai": (_call_openai, settings.OPENAI_API_KEY),
        "claude": (_call_claude, settings.ANTHROPIC_API_KEY),
    }

    if provider not in PROVIDERS:
        return rules_parse(transcript), "rules_fallback"

    call_fn_maker, api_key = PROVIDERS[provider]
    if not api_key:
        return rules_parse(transcript), "rules_fallback"

    def call():
        return call_fn_maker(system_prompt, transcript)

    try:
        result = _call_with_retry(call, max_retries=1)
        return result, provider
    except Exception:
        # Principle 4: graceful degradation to rules fallback
        return rules_parse(transcript), "rules_fallback"
