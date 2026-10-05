"""
AI + scoring logic.  Owner: automation teammate.

main.py only uses these functions:
    intake_agent()   - classify one complaint
    dedup_agent()    - is it a duplicate of an open issue?
    compute_priority()
    summarize()      - weekly report text
Change prompts/logic here freely, but keep the return shapes the same.
If the LLM fails (rate limit, bad JSON) every function falls back to a safe default,
so the demo never crashes.
"""
import json
import logging
import os
import time

from openai import NotFoundError, OpenAI, RateLimitError

log = logging.getLogger("agents")

CATEGORIES = ["mess", "water", "electricity", "cleanliness", "internet", "maintenance", "other"]
SENSITIVE_WORDS = ["harass", "ragging", "ragged", "assault", "molest", "stalk", "threaten",
                   "abuse", "sexual", "blackmail", "suicid", "self harm", "self-harm"]

# Works with Gemini, Groq, OpenRouter, Ollama (anything OpenAI-compatible). Set in .env
_api_key = os.getenv("LLM_API_KEY", "mock-key")
_base_url = os.getenv("LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
llm = OpenAI(api_key=_api_key, base_url=_base_url)

# LLM_MODEL can hold SEVERAL models separated by commas, e.g.  gemini-3.5-flash,gemini-3.7-flash
# Free tiers limit requests per model per day, so when one runs out we automatically try the next.
raw_models = os.getenv("LLM_MODEL", "gemini-1.5-flash")
MODELS = [m.strip() for m in raw_models.split(",") if m.strip()] or ["gemini-1.5-flash"]
MODEL = MODELS[0]
_blocked_until: dict[str, float] = {}      # model name -> time (seconds) until we skip it


# ---------------------------------------------------------------- LLM helpers
def ask_llm_text(system: str, user: str) -> str:
    now = time.time()
    order = [m for m in MODELS if _blocked_until.get(m, 0) <= now] or MODELS
    last: Exception | None = None
    for m in order:
        try:
            res = llm.chat.completions.create(
                model=m,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            )
            return (res.choices[0].message.content or "").strip()
        except (RateLimitError, NotFoundError) as ex:
            last = ex
            _blocked_until[m] = now + 600          # skip this model for 10 minutes
            log.warning("Model %s unavailable (%s); trying next model", m, type(ex).__name__)
    if last is not None:
        raise last
    raise RuntimeError("LLM service request failed: no available models responded")


def ask_llm_json(system: str, user: str, retries: int = 1) -> dict:
    last: Exception | None = None
    for _ in range(retries + 1):
        try:
            text = ask_llm_text(system + "\nReturn ONLY valid JSON. No markdown, no extra text.", user)
            text = text.replace("```json", "").replace("```", "").strip()
            start, end = text.find("{"), text.rfind("}")      # tolerate words around the JSON
            return json.loads(text[start:end + 1])
        except Exception as ex:                                 # noqa: BLE001
            last = ex
            log.warning("LLM call/parse failed: %s", ex)
    if last is not None:
        raise last
    raise RuntimeError("LLM JSON parsing failed after retries")


def has_sensitive_words(text: str) -> bool:
    t = text.lower()
    return any(w in t for w in SENSITIVE_WORDS)


# ---------------------------------------------------------------- agents
def intake_agent(title: str, text: str, block: str, category_hint: str | None, urgency: str) -> dict:
    """Returns: category, severity(1-4), title, cleaned_text, is_sensitive, follow_up, used_fallback"""
    try:
        r = ask_llm_json(
            "You are the intake agent of a hostel complaint system. Extract fields from the student's complaint. "
            f"category must be one of {CATEGORIES}. "
            "severity: 1 minor, 2 normal, 3 serious, 4 critical (health risk, no water or power for a whole floor/block). "
            "is_sensitive=true ONLY for harassment, assault, ragging, personal safety threats or self-harm. "
            "title: max 10 words, neutral. cleaned_text: one clear sentence, no personal names. "
            "follow_up: ONE short question if key details are missing, else null. "
            "JSON keys: category, severity, title, cleaned_text, is_sensitive, follow_up",
            f"Block: {block}\nStudent title: {title}\nComplaint: {text}",
        )
        category = category_hint or r.get("category")
        if category not in CATEGORIES:
            category = "other"
        try:
            severity = min(4, max(1, int(r.get("severity", 2))))
        except (TypeError, ValueError):
            severity = 2
        if urgency == "urgent":
            severity = max(severity, 3)
        follow_up = r.get("follow_up")
        if not follow_up or str(follow_up).strip().lower() in ("null", "none"):
            follow_up = None
        return {
            "category": category,
            "severity": severity,
            "title": str(r.get("title") or title or text[:60])[:120],
            "cleaned_text": str(r.get("cleaned_text") or text)[:500],
            "is_sensitive": bool(r.get("is_sensitive")) or has_sensitive_words(text),
            "follow_up": follow_up,
            "used_fallback": False,
        }
    except Exception:                                           # noqa: BLE001
        log.exception("intake_agent fell back to defaults")
        return {
            "category": category_hint or "other",
            "severity": 3 if urgency == "urgent" else 2,
            "title": (title or text[:60])[:120],
            "cleaned_text": text[:500],
            "is_sensitive": has_sensitive_words(text),
            "follow_up": None,
            "used_fallback": True,
        }


def dedup_agent(new_title: str, new_text: str, candidates: list[dict]) -> str | None:
    """candidates = open issues (same block + category, last 72h). Returns an issue id or None."""
    if not candidates:
        return None
    listing = "\n".join(f"- id={c['id']} | {c['title']} | {c.get('summary') or ''}" for c in candidates)
    try:
        res = ask_llm_json(
            "You are the duplicate-detection agent. Decide if the NEW complaint describes the same real-world "
            "problem as one of the OPEN issues (different wording can still be the same problem, e.g. 'no water' "
            "and 'tap is dry'). Be strict: different problems in the same category are NOT duplicates. "
            "JSON keys: duplicate_of (an id from the list, or null)",
            f"NEW: {new_title} - {new_text}\n\nOPEN ISSUES:\n{listing}",
        )
        valid = {c["id"] for c in candidates}
        return res.get("duplicate_of") if res.get("duplicate_of") in valid else None
    except Exception:                                           # noqa: BLE001
        log.exception("dedup_agent failed; treating as not duplicate")
        return None


def compute_priority(severity: int, reporters: int, hours_open: float) -> float:
    """severity 50% + reporters 30% + hours open 20%. Severity 4 always sits above everything else."""
    score = (severity / 4) * 50 + (min(reporters, 10) / 10) * 30 + (min(hours_open, 96) / 96) * 20
    if severity >= 4:
        score += 100
    return round(score, 1)


def summarize(stats_json: str) -> str:
    try:
        return ask_llm_text(
            "You write short weekly summaries for a hostel warden.",
            "Write a short weekly hostel complaint summary (5-6 lines) from this data:\n" + stats_json,
        )
    except Exception:                                           # noqa: BLE001
        log.exception("summarize failed")
        return "Summary unavailable (AI service busy). See the statistics below."