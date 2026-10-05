"""
Hostel & Mess Complaint Agent - backend v2
Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs   (test every endpoint here)
Needs Python 3.11+
"""
import json
import os
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import UUID

from dotenv import load_dotenv

load_dotenv()  # must run before `import agents` (it reads the .env keys)

from apscheduler.schedulers.background import BackgroundScheduler  # noqa: E402
from fastapi import Depends, FastAPI, Header, HTTPException, Query  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import RedirectResponse  # noqa: E402
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer  # noqa: E402
from pydantic import BaseModel  # noqa: E402
from supabase import create_client  # noqa: E402

import agents  # noqa: E402

# ------------------------------------------------------------------ setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "placeholder-key")
sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
ADMIN_KEY = os.getenv("ADMIN_KEY", "")                       # dev/demo only
WARDEN_EMAIL = os.getenv("WARDEN_EMAIL", "warden@hostel-demo.local")

raw_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000")
if raw_origins.strip() == "*":
    ORIGINS = ["*"]
else:
    ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]

CATEGORIES = agents.CATEGORIES
ACTIVE = ["open", "in_progress", "reopened"]
EDIT_WINDOW = timedelta(minutes=10)

# TODO [confirm with your college]: replace TO_BE_CONFIRMED with real numbers. Do not invent any.
EMERGENCY_CONTACTS = [
    {"name": "National Emergency Number (India)", "phone": "112"},
    {"name": "Hostel Warden", "phone": "TO_BE_CONFIRMED"},
    {"name": "Hostel Security Desk", "phone": "TO_BE_CONFIRMED"},
    {"name": "College Anti-Harassment Committee (ICC)", "phone": "TO_BE_CONFIRMED"},
]
SERIOUS_MSG = (
    "This looks like a serious safety or harassment matter, so it was NOT posted publicly. "
    "A warden has been told privately. If you are in danger, call 112 or the contacts below."
)


# ------------------------------------------------------------------ helpers
def now() -> datetime:
    return datetime.now(timezone.utc)


def parse_ts(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def hours_since(ts: str) -> float:
    return (now() - parse_ts(ts)).total_seconds() / 3600


def is_uuid(v: str) -> bool:
    try:
        UUID(v)
        return True
    except ValueError:
        return False


def get_one(table: str, value: str, col: str = "id"):
    rows = sb.table(table).select("*").eq(col, value).limit(1).execute().data
    if not rows:
        raise HTTPException(404, f"{table} not found")
    return rows[0]


def find(table: str, ident: str):
    """Accepts either the uuid or the public id (ISS-00001 / CMP-00001)."""
    return get_one(table, ident, "id" if is_uuid(ident) else "public_id")


def log_event(issue_id, event_type, detail=""):
    sb.table("issue_events").insert({"issue_id": issue_id, "event_type": event_type, "detail": detail}).execute()


def update_issue(issue_id, fields: dict, touch: bool = True):
    if touch:
        fields = {**fields, "updated_at": now().isoformat()}
    sb.table("issues").update(fields).eq("id", issue_id).execute()


def send_to_outbox(issue_id, to_email, subject, body):
    """Demo: the 'email' is saved in the outbox table = simulated office inbox."""
    sb.table("outbox").insert({"issue_id": issue_id, "to_email": to_email, "subject": subject, "body": body}).execute()


def notify(user_ids, message, issue=None, link=None):
    rows = [{"user_id": u, "issue_id": issue["id"] if issue else None, "message": message,
             "link": link or (f"/issues/{issue['public_id']}" if issue else None)}
            for u in set(user_ids) if u]
    if rows:
        sb.table("notifications").insert(rows).execute()


def notify_reporters(issue, message):
    ids = [c["user_id"] for c in sb.table("complaints").select("user_id")
           .eq("issue_id", issue["id"]).eq("status", "submitted").execute().data]
    notify(ids, message, issue)


def notify_roles(roles, message, issue=None, link=None):
    ids = [p["id"] for p in sb.table("profiles").select("id").in_("role", roles).execute().data]
    notify(ids, message, issue, link)


def notify_office(office_id, message, issue):
    ids = [p["id"] for p in sb.table("profiles").select("id").eq("office_id", office_id).execute().data]
    notify(ids, message, issue)


def history_text(issue_id) -> str:
    events = sb.table("issue_events").select("event_type,detail,created_at") \
        .eq("issue_id", issue_id).order("created_at").execute().data
    return "\n".join(f"{e['created_at']}  {e['event_type']}: {e['detail']}" for e in events)


# ------------------------------------------------------------------ auth + roles
bearer_scheme = HTTPBearer(auto_error=False)   # makes Swagger show the green Authorize button


def profile_from_token(token: str):
    """Verifies a Supabase access token and returns the user's profile (with role)."""
    try:
        user = sb.auth.get_user(token).user
    except Exception as e:
        print("AUTH ERROR:", repr(e))
        raise HTTPException(401, "Invalid token")
    if not user:
        raise HTTPException(401, "Invalid token")
    rows = sb.table("profiles").select("*").eq("id", user.id).limit(1).execute().data
    if rows:
        return rows[0]
    return sb.table("profiles").insert({"id": user.id, "email": user.email}).execute().data[0]


def current_profile(creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    """Student-style endpoints: needs header  Authorization: Bearer <token>."""
    if not creds or not creds.credentials:
        raise HTTPException(401, "Missing token")
    return profile_from_token(creds.credentials)


def require_roles(*roles):
    def dep(creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
            x_admin_key: str = Header(default="")):
        if ADMIN_KEY and x_admin_key == ADMIN_KEY:     # dev/demo shortcut
            return {"id": None, "email": "admin-key", "role": "admin", "office_id": None}
        if not creds or not creds.credentials:
            raise HTTPException(401, "Missing token")
        prof = profile_from_token(creds.credentials)
        if prof["role"] not in roles:
            raise HTTPException(403, "Your role cannot do this")
        return prof
    return dep


ANY_USER = require_roles("student", "office", "warden", "admin")
STAFF = require_roles("office", "warden", "admin")
WARDEN_UP = require_roles("warden", "admin")
ADMIN_ONLY = require_roles("admin")


def check_office_scope(prof, issue):
    if prof["role"] == "office" and issue["owner_office_id"] != prof.get("office_id"):
        raise HTTPException(403, "This issue belongs to another office")


def reporter_names(user_ids):
    if not user_ids:
        return {}
    rows = sb.table("profiles").select("id,full_name,email").in_("id", list(user_ids)).execute().data
    return {r["id"]: (r["full_name"] or r["email"] or "Student") for r in rows}


def complaint_view(c, viewer_role, names):
    """Privacy rule: names only for warden/admin; anonymous only if student agreed to share."""
    can_see = viewer_role in ("warden", "admin")
    if c["is_anonymous"]:
        who = names.get(c["user_id"], "Student") if (can_see and c["share_identity_with_warden"]) else "Anonymous"
    else:
        who = names.get(c["user_id"], "Student") if can_see else "Student"
    return {"id": c["id"], "public_id": c["public_id"], "title": c["title"], "text": c["raw_text"],
            "block": c["block"], "floor": c["floor"], "room": c["room"], "photo_url": c["photo_url"],
            "urgency": c["urgency"], "status": c["status"], "created_at": c["created_at"],
            "follow_up_question": c["follow_up_question"], "follow_up_answer": c["follow_up_answer"],
            "reporter": who}


# ------------------------------------------------------------------ routing + serious concerns
def route_issue(issue):
    rows = sb.table("category_routes").select("office_id, offices(*)").eq("category", issue["category"]).limit(1).execute().data
    if not rows:
        return
    office = rows[0]["offices"]
    update_issue(issue["id"], {"owner_office_id": office["id"]})
    send_to_outbox(
        issue["id"], office["email"],
        f"[Priority {issue['priority_score']}] {issue['title']} - Block {issue['block']} ({issue['public_id']})",
        f"Category: {issue['category']}\nBlock: {issue['block']}\nSeverity: {issue['severity']}/4\n"
        f"Reported by: {issue['reporter_count']} student(s)\n\n{issue.get('summary') or issue['title']}\n\n"
        "Please mark it in-progress within 24 hours. Unanswered issues escalate to the warden at 48 hours.",
    )
    log_event(issue["id"], "routed", f"Sent to {office['name']}")
    notify_office(office["id"], f"New issue assigned: {issue['title']}", issue)


def handle_serious(profile, text, block, share_identity, source):
    sb.table("serious_concerns").insert({
        "user_id": profile["id"] if share_identity else None,
        "text": text, "block": block, "source": source}).execute()
    send_to_outbox(None, WARDEN_EMAIL, "[CONFIDENTIAL] Serious concern reported",
                   f"Block: {block}\nSource: {source}\n\n{text}")
    notify_roles(["warden", "admin"], "A serious concern was reported (private, not on the public tracker).",
                 None, "/warden/serious")
    return {"status": "sensitive", "message": SERIOUS_MSG, "emergency_contacts": EMERGENCY_CONTACTS}


# ------------------------------------------------------------------ monitor agent (timers)
_tick_lock = threading.Lock()


def monitor_tick():
    """Every 30s: 24h reminder, 48h -> Level 2 (warden), 96h -> Level 3 (admin), priority refresh."""
    with _tick_lock:
        issues = sb.table("issues").select("*, offices(*)").in_("status", ACTIVE).execute().data
        for i in issues:
            try:
                hours = hours_since(i["opened_at"])
                office = i.get("offices")
                upd = {}
                score = agents.compute_priority(i["severity"], i["reporter_count"], hours)
                if abs(score - float(i["priority_score"])) >= 0.1:
                    upd["priority_score"] = score
                significant = False

                if i["status"] in ("open", "reopened") and office:
                    level = i["escalation_level"]
                    if hours >= 24 and not i["reminder_sent_at"]:
                        send_to_outbox(i["id"], office["email"], f"REMINDER: {i['title']} ({i['public_id']})",
                                       f"Open {hours:.0f}h with no progress. {i['reporter_count']} student(s) affected.")
                        upd["reminder_sent_at"] = now().isoformat()
                        log_event(i["id"], "reminder", f"24h reminder sent to {office['name']}")
                        notify_reporters(i, "We reminded the office about your issue.")
                        significant = True
                    if hours >= 48 and level < 2:
                        send_to_outbox(i["id"], office["escalation_email"],
                                       f"ESCALATION L2: {i['title']} (Block {i['block']}, {i['public_id']})",
                                       f"No response for {hours:.0f}h. {i['reporter_count']} students affected, "
                                       f"severity {i['severity']}/4.\n\nHistory:\n{history_text(i['id'])}")
                        upd.update({"escalation_level": 2, "escalated_at": now().isoformat()})
                        level = 2
                        log_event(i["id"], "escalated", f"Level 2: escalated to {office['escalation_name']}")
                        notify_roles(["warden", "admin"], f"Escalated to you: {i['title']}", i)
                        notify_reporters(i, "Your issue was escalated to the warden.")
                        significant = True
                    if hours >= 96 and level < 3:
                        send_to_outbox(i["id"], office["final_email"],
                                       f"ESCALATION L3: {i['title']} (Block {i['block']}, {i['public_id']})",
                                       f"Still unresolved after {hours:.0f}h.\n\nHistory:\n{history_text(i['id'])}")
                        upd.update({"escalation_level": 3, "escalated_l3_at": now().isoformat()})
                        log_event(i["id"], "escalated", f"Level 3: escalated to {office['final_name']}")
                        notify_roles(["admin"], f"Level 3 escalation: {i['title']}", i)
                        notify_reporters(i, "Your issue was escalated to the hostel administration.")
                        significant = True

                if upd:
                    update_issue(i["id"], upd, touch=significant)
            except Exception as ex:   # one bad issue must not stop the others
                print(f"monitor_tick error on {i.get('public_id')}: {ex}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    sched = BackgroundScheduler()
    sched.add_job(monitor_tick, "interval", seconds=30, max_instances=1)
    sched.start()
    yield
    sched.shutdown()


app = FastAPI(title="Hostel Complaint Agent", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ================================================================== STUDENT ENDPOINTS
class ComplaintIn(BaseModel):
    title: str = ""
    text: str
    block: str
    floor: str | None = None
    room: str | None = None
    photo_url: str | None = None
    is_anonymous: bool = False
    share_identity_with_warden: bool = False
    category: str | None = None      # None or "auto" = auto-detect
    urgency: str = "normal"          # normal | urgent


@app.get("/me")
def me(prof=Depends(current_profile)):
    return prof


@app.post("/complaints")
def submit_complaint(c: ComplaintIn, prof=Depends(current_profile)):
    if not c.text.strip():
        raise HTTPException(400, "text is required")
    block = c.block.strip()
    hint = c.category.lower() if c.category and c.category.lower() in CATEGORIES else None
    urgency = "urgent" if c.urgency.lower() == "urgent" else "normal"

    info = agents.intake_agent(c.title, c.text, block, hint, urgency)

    if info["is_sensitive"]:    # never auto-route or publish
        share = (not c.is_anonymous) or c.share_identity_with_warden
        return handle_serious(prof, c.text, block, share, "auto_detected")

    category = info["category"]
    since = (now() - timedelta(hours=72)).isoformat()
    candidates = (sb.table("issues").select("id,public_id,category,block,title,summary,severity")
                  .eq("block", block).eq("category", category)
                  .in_("status", ACTIVE).gte("opened_at", since).execute().data)
    dup_id = agents.dedup_agent(info["title"], info["cleaned_text"], candidates)

    if dup_id:
        issue = get_one("issues", dup_id)
        # count distinct students: a second report from the same student must not inflate the count
        already = (sb.table("complaints").select("id").eq("issue_id", dup_id).eq("user_id", prof["id"])
                   .eq("status", "submitted").limit(1).execute().data)
        count = issue["reporter_count"] if already else issue["reporter_count"] + 1
        sev = max(issue["severity"], info["severity"])
        update_issue(dup_id, {"reporter_count": count, "severity": sev,
                              "priority_score": agents.compute_priority(sev, count, hours_since(issue["opened_at"]))})
        log_event(dup_id, "grouped", "Same student added another report" if already else f"Now reported by {count} students")
        issue_id, grouped = dup_id, True
    else:
        issue = sb.table("issues").insert({
            "category": category, "block": block, "title": info["title"], "summary": info["cleaned_text"],
            "severity": info["severity"], "priority_score": agents.compute_priority(info["severity"], 1, 0),
        }).execute().data[0]
        log_event(issue["id"], "created", "Issue created from first complaint")
        route_issue(issue)
        issue_id, grouped = issue["id"], False

    complaint = sb.table("complaints").insert({
        "issue_id": issue_id, "user_id": prof["id"], "title": c.title or info["title"], "raw_text": c.text,
        "cleaned_text": info["cleaned_text"], "block": block, "floor": c.floor, "room": c.room,
        "photo_url": c.photo_url, "urgency": urgency, "category_hint": hint,
        "is_anonymous": c.is_anonymous, "share_identity_with_warden": c.share_identity_with_warden,
        "follow_up_question": info["follow_up"],
    }).execute().data[0]

    final = get_one("issues", issue_id)
    return {"status": "ok", "grouped_with_existing": grouped, "follow_up": info["follow_up"],
            "used_fallback": info["used_fallback"], "complaint": complaint, "issue": final}


class FollowUpIn(BaseModel):
    answer: str


def own_complaint(ident, prof):
    comp = find("complaints", ident)
    if comp["user_id"] != prof["id"]:
        raise HTTPException(403, "Not your complaint")
    return comp


@app.post("/complaints/{ident}/follow-up")
def answer_follow_up(ident: str, body: FollowUpIn, prof=Depends(current_profile)):
    comp = own_complaint(ident, prof)
    sb.table("complaints").update({"follow_up_answer": body.answer}).eq("id", comp["id"]).execute()
    issue = get_one("issues", comp["issue_id"])
    if issue["reporter_count"] == 1:
        update_issue(issue["id"], {"summary": f"{issue.get('summary') or ''} | Extra detail: {body.answer}"})
    log_event(issue["id"], "follow_up_answered", "Student added more detail")
    return {"ok": True}


class ComplaintEdit(BaseModel):
    title: str | None = None
    text: str | None = None
    floor: str | None = None
    room: str | None = None
    photo_url: str | None = None


@app.patch("/complaints/{ident}")
def edit_complaint(ident: str, body: ComplaintEdit, prof=Depends(current_profile)):
    comp = own_complaint(ident, prof)
    issue = get_one("issues", comp["issue_id"])
    if comp["status"] != "submitted":
        raise HTTPException(400, "Complaint is withdrawn")
    if now() - parse_ts(comp["created_at"]) > EDIT_WINDOW:
        raise HTTPException(400, "Edit window (10 minutes) has passed")
    if issue["reporter_count"] > 1:
        raise HTTPException(400, "Already grouped with other complaints; cannot edit")
    fields = body.model_dump(exclude_none=True)
    if "text" in fields:
        fields["raw_text"] = fields.pop("text")
    if not fields:
        raise HTTPException(400, "Nothing to update")
    sb.table("complaints").update(fields).eq("id", comp["id"]).execute()
    if "raw_text" in fields:
        update_issue(issue["id"], {"summary": fields["raw_text"][:500]})
    log_event(issue["id"], "edited", "Student edited the complaint")
    return get_one("complaints", comp["id"])


@app.post("/complaints/{ident}/withdraw")
def withdraw_complaint(ident: str, prof=Depends(current_profile)):
    comp = own_complaint(ident, prof)
    issue = get_one("issues", comp["issue_id"])
    if comp["status"] == "withdrawn":
        raise HTTPException(400, "Already withdrawn")
    if issue["status"] not in ACTIVE:
        raise HTTPException(400, "Issue is already resolved/closed")
    sb.table("complaints").update({"status": "withdrawn"}).eq("id", comp["id"]).execute()
    left = max(0, issue["reporter_count"] - 1)
    upd = {"reporter_count": left}
    if left == 0:
        upd["status"] = "withdrawn"
    update_issue(issue["id"], upd)
    log_event(issue["id"], "withdrawn", "A student withdrew their complaint")
    return {"ok": True, "issue_status": upd.get("status", issue["status"])}


@app.get("/my-complaints")
def my_complaints(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                  prof=Depends(current_profile)):
    q = (sb.table("complaints")
         .select("*, issues(public_id,title,status,reporter_count,escalation_level,category,block,updated_at)")
         .eq("user_id", prof["id"]).order("created_at", desc=True).range(offset, offset + limit - 1))
    return q.execute().data


class ConfirmIn(BaseModel):
    fixed: bool


@app.post("/issues/{ident}/confirm")
def confirm_resolution(ident: str, body: ConfirmIn, prof=Depends(current_profile)):
    issue = find("issues", ident)
    if issue["status"] != "resolved":
        raise HTTPException(400, "Issue is not awaiting confirmation")
    mine = sb.table("complaints").select("id").eq("issue_id", issue["id"]) \
        .eq("user_id", prof["id"]).eq("status", "submitted").limit(1).execute().data
    if not mine:
        raise HTTPException(403, "Only reporters of this issue can confirm")
    sb.table("resolution_votes").upsert(
        {"issue_id": issue["id"], "user_id": prof["id"], "fixed": body.fixed},
        on_conflict="issue_id,user_id").execute()
    log_event(issue["id"], "confirmed", f"A reporter said {'fixed' if body.fixed else 'NOT fixed'}")

    if not body.fixed:
        update_issue(issue["id"], {"status": "reopened", "opened_at": now().isoformat(),
                                   "reminder_sent_at": None, "escalated_at": None, "escalated_l3_at": None,
                                   "escalation_level": 1, "resolved_at": None})
        sb.table("resolution_votes").delete().eq("issue_id", issue["id"]).execute()
        log_event(issue["id"], "reopened", "Reporter says it is not fixed; timers restarted")
        if issue.get("owner_office_id"):
            notify_office(issue["owner_office_id"], f"Reopened: {issue['title']}", issue)
        return {"status": "reopened"}

    votes = sb.table("resolution_votes").select("fixed").eq("issue_id", issue["id"]).execute().data
    if sum(1 for v in votes if v["fixed"]) >= max(1, (issue["reporter_count"] + 1) // 2):
        update_issue(issue["id"], {"status": "closed"})
        log_event(issue["id"], "closed", "Confirmed fixed by reporters")
        return {"status": "closed"}
    return {"status": "waiting_for_more_confirmations"}


# ---- notifications (the frontend also listens live via Supabase realtime)
@app.get("/notifications")
def my_notifications(limit: int = Query(30, ge=1, le=100), offset: int = Query(0, ge=0),
                     prof=Depends(current_profile)):
    return (sb.table("notifications").select("*").eq("user_id", prof["id"])
            .order("created_at", desc=True).range(offset, offset + limit - 1).execute().data)


@app.post("/notifications/read-all")
def read_all(prof=Depends(current_profile)):
    sb.table("notifications").update({"is_read": True}).eq("user_id", prof["id"]).eq("is_read", False).execute()
    return {"ok": True}


@app.post("/notifications/{notif_id}/read")
def read_one(notif_id: str, prof=Depends(current_profile)):
    sb.table("notifications").update({"is_read": True}).eq("id", notif_id).eq("user_id", prof["id"]).execute()
    return {"ok": True}


# ---- serious concerns
class SeriousIn(BaseModel):
    text: str
    block: str | None = None
    share_identity: bool = False


@app.post("/serious-concern")
def serious_concern(body: SeriousIn, prof=Depends(current_profile)):
    return handle_serious(prof, body.text, body.block, body.share_identity, "student_button")


@app.get("/emergency-contacts")
def emergency_contacts():
    return EMERGENCY_CONTACTS


@app.get("/serious-concerns")
def list_serious(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0), _=Depends(WARDEN_UP)):
    rows = (sb.table("serious_concerns").select("*").order("created_at", desc=True)
            .range(offset, offset + limit - 1).execute().data)
    names = reporter_names({r["user_id"] for r in rows if r["user_id"]})
    for r in rows:
        r["reporter"] = names.get(r["user_id"], "Student") if r["user_id"] else "Anonymous"
    return rows


# ================================================================== PUBLIC TRACKER
@app.get("/tracker")
def tracker(block: str | None = None, category: str | None = None, status: str | None = None,
            sort: str = "newest", q: str | None = None,
            limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    query = sb.table("public_issues").select("*").neq("status", "withdrawn")
    if block:
        query = query.eq("block", block)
    if category:
        query = query.eq("category", category)
    if status:
        query = query.eq("status", status)
    if q:
        query = query.ilike("public_id", f"%{q.strip()}%")
    if sort == "most_reported":
        query = query.order("reporter_count", desc=True).order("opened_at", desc=True)
    else:
        query = query.order("opened_at", desc=True)
    return query.range(offset, offset + limit - 1).execute().data


@app.get("/tracker/stats")
def tracker_stats():
    rows = sb.table("public_issues").select("*").neq("status", "withdrawn").limit(2000).execute().data
    by_status, by_category = {}, {}
    resp = []
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
        by_category[r["category"]] = by_category.get(r["category"], 0) + 1
        if r["first_response_at"]:
            resp.append((parse_ts(r["first_response_at"]) - parse_ts(r["opened_at"])).total_seconds() / 3600)
    return {"total": len(rows), "by_status": by_status, "by_category": by_category,
            "escalated": sum(1 for r in rows if r["escalation_level"] > 1),
            "avg_first_response_hours": round(sum(resp) / len(resp), 1) if resp else None}


@app.get("/tracker/{ident}/history")
def issue_history(ident: str):
    col = "id" if is_uuid(ident) else "public_id"
    rows = sb.table("public_issues").select("id").eq(col, ident).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Issue not found")
    return (sb.table("public_issue_events").select("*").eq("issue_id", rows[0]["id"])
            .order("created_at").execute().data)


# ================================================================== STAFF ENDPOINTS
@app.get("/offices")
def offices(prof=Depends(ANY_USER)):
    rows = sb.table("offices").select("*").execute().data
    routes = sb.table("category_routes").select("*").execute().data
    staff = prof["role"] in ("office", "warden", "admin")
    out = []
    for o in rows:
        item = {"id": o["id"], "name": o["name"],
                "categories": [r["category"] for r in routes if r["office_id"] == o["id"]]}
        if staff:
            item.update({"email": o["email"], "escalation_name": o["escalation_name"],
                         "escalation_email": o["escalation_email"], "final_name": o["final_name"],
                         "final_email": o["final_email"]})
        out.append(item)
    return out


@app.get("/issues")
def list_issues(block: str | None = None, status: str | None = None, category: str | None = None,
                limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0), prof=Depends(STAFF)):
    q = sb.table("issues").select("*, offices(name)").neq("status", "withdrawn")
    if prof["role"] == "office":
        q = q.eq("owner_office_id", prof["office_id"])
    if block:
        q = q.eq("block", block)
    if status:
        q = q.eq("status", status)
    if category:
        q = q.eq("category", category)
    return q.order("priority_score", desc=True).range(offset, offset + limit - 1).execute().data


@app.get("/issues/{ident}")
def issue_detail(ident: str, prof=Depends(ANY_USER)):
    issue = find("issues", ident)
    comps = sb.table("complaints").select("*").eq("issue_id", issue["id"]).order("created_at").execute().data
    if prof["role"] == "student":
        mine = [c for c in comps if c["user_id"] == prof["id"]]
        if not mine:
            raise HTTPException(403, "Not your issue (see the public tracker)")
        return {"issue": issue, "complaints": [complaint_view(c, "student", {}) for c in mine]}
    check_office_scope(prof, issue)
    names = reporter_names({c["user_id"] for c in comps if c["user_id"]}) if prof["role"] in ("warden", "admin") else {}
    return {"issue": issue, "complaints": [complaint_view(c, prof["role"], names) for c in comps],
            "history": sb.table("issue_events").select("*").eq("issue_id", issue["id"]).order("created_at").execute().data}


class StatusIn(BaseModel):
    status: str   # in_progress | resolved


@app.post("/issues/{ident}/status")
def set_status(ident: str, body: StatusIn, prof=Depends(STAFF)):
    if body.status not in ("in_progress", "resolved"):
        raise HTTPException(400, "status must be in_progress or resolved")
    issue = find("issues", ident)
    check_office_scope(prof, issue)
    if issue["status"] not in ACTIVE:
        raise HTTPException(400, f"Issue is {issue['status']}")
    upd = {"status": body.status}
    if not issue["first_response_at"]:
        upd["first_response_at"] = now().isoformat()
    if body.status == "resolved":
        upd["resolved_at"] = now().isoformat()
        sb.table("resolution_votes").delete().eq("issue_id", issue["id"]).execute()
    update_issue(issue["id"], upd)
    log_event(issue["id"], body.status, "Updated by office/warden")
    notify_reporters(issue, "Marked resolved. Please confirm if it is really fixed."
                     if body.status == "resolved" else "Work on your issue has started.")
    return {"ok": True}


class SplitIn(BaseModel):
    complaint_id: str


@app.post("/admin/split")
def split_complaint(body: SplitIn, _=Depends(WARDEN_UP)):
    """Warden fixes a wrong merge: moves one complaint into its own new issue."""
    comp = find("complaints", body.complaint_id)
    old = get_one("issues", comp["issue_id"])
    if old["reporter_count"] < 2:
        raise HTTPException(400, "This issue has only one complaint")
    new = sb.table("issues").insert({
        "category": old["category"], "block": old["block"], "title": (comp["title"] or comp["raw_text"])[:80],
        "summary": comp["cleaned_text"] or comp["raw_text"], "severity": old["severity"],
        "priority_score": agents.compute_priority(old["severity"], 1, 0),
    }).execute().data[0]
    sb.table("complaints").update({"issue_id": new["id"]}).eq("id", comp["id"]).execute()
    update_issue(old["id"], {"reporter_count": old["reporter_count"] - 1})
    log_event(old["id"], "split", "Warden split one complaint into a separate issue")
    log_event(new["id"], "created", "Created by warden split")
    route_issue(new)
    return {"new_issue_id": new["id"], "new_public_id": new["public_id"]}


@app.get("/admin/outbox")
def admin_outbox(issue_id: str | None = None, limit: int = Query(50, ge=1, le=200),
                 offset: int = Query(0, ge=0), _=Depends(WARDEN_UP)):
    q = sb.table("outbox").select("*").order("created_at", desc=True)
    if issue_id:
        q = q.eq("issue_id", find("issues", issue_id)["id"])
    return q.range(offset, offset + limit - 1).execute().data


@app.get("/reports/weekly")
def weekly_report(send: bool = False, _=Depends(WARDEN_UP)):
    since = (now() - timedelta(days=7)).isoformat()
    rows = sb.table("issues").select("*").gte("opened_at", since).execute().data
    resp = [(parse_ts(r["first_response_at"]) - parse_ts(r["opened_at"])).total_seconds() / 3600
            for r in rows if r["first_response_at"]]
    by_cat = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    stats = {
        "total_issues": len(rows), "by_category": by_cat,
        "avg_first_response_hours": round(sum(resp) / len(resp), 1) if resp else None,
        "overdue": [{"public_id": r["public_id"], "title": r["title"], "block": r["block"]}
                    for r in rows if r["escalation_level"] > 1 and r["status"] in ("open", "reopened")],
        "top_issues": [{"public_id": r["public_id"], "title": r["title"], "priority": r["priority_score"]}
                       for r in sorted(rows, key=lambda r: r["priority_score"], reverse=True)[:5]],
    }
    summary = agents.summarize(json.dumps(stats, default=str))
    if send:
        send_to_outbox(None, WARDEN_EMAIL, "Weekly hostel complaint report", summary)
    return {"stats": stats, "summary": summary}


# ================================================================== AI TEAMMATE HELPERS
def fetch_candidates(block: str, category: str | None = None, hours: int = 72, statuses: list[str] | None = None):
    q = (sb.table("issues")
         .select("id,public_id,category,block,title,summary,severity,status,reporter_count,opened_at")
         .eq("block", block).in_("status", statuses or ACTIVE)
         .gte("opened_at", (now() - timedelta(hours=hours)).isoformat()))
    if category:
        q = q.eq("category", category)
    return q.order("opened_at", desc=True).execute().data


@app.get("/ai/candidates")
def ai_candidates(block: str, category: str | None = None, hours: int = Query(72, ge=1, le=720),
                  statuses: str = "open,in_progress,reopened", _=Depends(ADMIN_ONLY)):
    """Existing issues to compare a new complaint against (for duplicate detection).
    Use statuses=open,reopened if you only want those two."""
    st = [s for s in statuses.split(",") if s in ACTIVE] or ACTIVE
    return fetch_candidates(block.strip(), category, hours, st)


class AnalyzeIn(BaseModel):
    title: str = ""
    text: str
    block: str
    category: str | None = None
    urgency: str = "normal"


@app.post("/ai/analyze")
def ai_analyze(body: AnalyzeIn, _=Depends(ADMIN_ONLY)):
    """DRY RUN: runs intake + duplicate detection and returns the result. Saves NOTHING.
    Use it to test accuracy on the 30-sample set."""
    block = body.block.strip()
    hint = body.category.lower() if body.category and body.category.lower() in CATEGORIES else None
    urgency = "urgent" if body.urgency.lower() == "urgent" else "normal"
    info = agents.intake_agent(body.title, body.text, block, hint, urgency)
    cands = fetch_candidates(block, info["category"])
    dup = agents.dedup_agent(info["title"], info["cleaned_text"], cands)
    return {"intake": info, "candidates_considered": cands, "duplicate_of": dup}


# ================================================================== DEMO CONTROLS
@app.post("/demo/skip-time/{ident}")
def skip_time(ident: str, hours: int | None = None, to_level: int | None = Query(None, ge=2, le=3),
              run_now: bool = True, _=Depends(ADMIN_ONLY)):
    """Pretend time passed. hours=24 -> reminder, to_level=2 -> warden (48h), to_level=3 -> admin (96h)."""
    issue = find("issues", ident)
    opened = parse_ts(issue["opened_at"])
    if to_level:
        target = 48 if to_level == 2 else 96
        new_open = min(opened, now() - timedelta(hours=target, minutes=1))
    else:
        new_open = opened - timedelta(hours=hours or 24)
    update_issue(issue["id"], {"opened_at": new_open.isoformat()}, touch=False)
    if run_now:
        monitor_tick()
    note = "Issue is in_progress, so timers are paused. Use /demo/reset first." if issue["status"] == "in_progress" else None
    return {"issue": get_one("issues", issue["id"]), "note": note}


@app.post("/demo/reset/{ident}")
def reset_issue(ident: str, _=Depends(ADMIN_ONLY)):
    issue = find("issues", ident)
    update_issue(issue["id"], {"status": "open", "opened_at": now().isoformat(), "reminder_sent_at": None,
                               "escalated_at": None, "escalated_l3_at": None, "escalation_level": 1,
                               "resolved_at": None, "first_response_at": None})
    log_event(issue["id"], "demo_reset", "Timers reset for demo")
    return get_one("issues", issue["id"])


@app.post("/demo/run-monitor")
def run_monitor_now(_=Depends(ADMIN_ONLY)):
    monitor_tick()
    return {"ok": True}


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"ok": True}