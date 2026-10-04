"""
Accuracy test on the 30-sample set. Uses NO database and saves nothing except two local files:
eval_cache.json (so a re-run does not spend AI requests again) and eval_results.csv (full results).

Usage (venv active, in the hostel-backend folder):
    python evaluate.py hostel_mess_30_sample_test_set.json

Options:
    --use-hints   use the 'category' hint from the file, like the real form does.
                  Default is to IGNORE hints, which tests the AI's own classification (harder, more honest).
    --delay 6     seconds to wait between AI calls (free tiers allow only a few requests per minute)
    --limit N     only the first N samples
    --fresh       ignore eval_cache.json (use this after you change prompts in agents.py)

If the free quota runs out, the script stops and keeps its progress. Run it again later or add more
models to LLM_MODEL; finished samples are not asked again.
"""
import argparse
import csv
import hashlib
import json
import logging
import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()  # shell variables (e.g. $env:LLM_API_KEY) win over .env, handy for using a second key

import agents  # noqa: E402

OFFICE = {"mess": "Mess Committee", "water": "Maintenance Desk", "cleanliness": "Maintenance Desk",
          "maintenance": "Maintenance Desk", "electricity": "Electrician", "internet": "IT / WiFi Desk",
          "other": "Hostel Admin Office"}
CACHE_FILE = "eval_cache.json"


class FailureCatcher(logging.Handler):
    """agents.py hides AI failures behind safe defaults; this notices them so we never score a fake answer."""
    def __init__(self):
        super().__init__(level=logging.ERROR)
        self.failed = False

    def emit(self, record):
        self.failed = True


catcher = FailureCatcher()
logging.getLogger("agents").addHandler(catcher)


def pct(a, b):
    return f"{a}/{b} = {100 * a / b:.1f}%" if b else "n/a"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--use-hints", action="store_true")
    ap.add_argument("--delay", type=float, default=6.0)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--fresh", action="store_true")
    args = ap.parse_args()

    with open(args.file, encoding="utf-8") as f:
        samples = json.load(f)
    if args.limit:
        samples = samples[:args.limit]

    cache = {}
    if not args.fresh and os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)
    calls = {"made": 0, "cached": 0}

    def cached_call(key, fn):
        if key in cache:
            calls["cached"] += 1
            return cache[key]
        catcher.failed = False
        result = fn()
        if catcher.failed:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f)
            print("\nSTOPPED: the AI call failed (most likely the free quota is used up).")
            print("Progress is saved. Add more models to LLM_MODEL or run again later.")
            sys.exit(1)
        cache[key] = result
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f)
        calls["made"] += 1
        time.sleep(args.delay)
        return result

    mode = "hint" if args.use_hints else "nohint"
    issues = []   # in-memory issues, like the database rows the real backend compares against
    rows = []
    print(f"Running {len(samples)} samples ({'using' if args.use_hints else 'ignoring'} category hints)...\n")

    for s in samples:
        sid = s["id"]
        hint = s.get("category") if args.use_hints else None
        info = cached_call(
            f"intake|{sid}|{mode}",
            lambda: agents.intake_agent(s.get("title", ""), s["text"], s["block"], hint, s.get("urgency", "normal")))
        pred_dup = None
        if not info["is_sensitive"]:
            cands = [i for i in issues if i["block"] == s["block"] and i["category"] == info["category"]]
            if cands:
                sig = hashlib.md5(json.dumps([info["title"], info["cleaned_text"]]).encode()).hexdigest()[:8]
                key = f"dedup|{sid}|{','.join(sorted(c['id'] for c in cands))}|{sig}"
                res = cached_call(key, lambda: {"dup": agents.dedup_agent(info["title"], info["cleaned_text"], cands)})
                if res["dup"]:
                    pred_dup = int(str(res["dup"]).lstrip("S"))
            if pred_dup is None:
                issues.append({"id": f"S{sid}", "block": s["block"], "category": info["category"],
                               "title": info["title"], "summary": info["cleaned_text"]})
        rows.append({
            "id": sid, "text": s["text"],
            "exp_cat": s["expected_category"], "pred_cat": info["category"],
            "exp_sev": s["expected_severity"], "pred_sev": info["severity"],
            "exp_sens": bool(s.get("expected_sensitive")), "pred_sens": bool(info["is_sensitive"]),
            "exp_dup": s["expected_duplicate_of"], "pred_dup": pred_dup,
            "fallback": info.get("used_fallback", False),
        })

    # ---- per-sample table
    print(f"{'ID':>3}  {'category exp -> got':<30} {'sev':<7} {'sens':<9} {'dup exp -> got':<15} result")
    for r in rows:
        miss = []
        if not r["exp_sens"] and r["exp_cat"] != r["pred_cat"]:
            miss.append("category")
        if not r["exp_sens"] and OFFICE[r["exp_cat"]] != OFFICE.get(r["pred_cat"]):
            miss.append("ROUTING")
        if r["exp_sens"] != r["pred_sens"]:
            miss.append("sensitive")
        if not r["exp_sens"] and r["exp_dup"] != r["pred_dup"]:
            miss.append("duplicate")
        r["miss"] = ",".join(miss)
        print(f"{r['id']:>3}  {r['exp_cat'] + ' -> ' + r['pred_cat']:<30} "
              f"{str(r['exp_sev']) + '/' + str(r['pred_sev']):<7} "
              f"{str(r['exp_sens'])[0] + '/' + str(r['pred_sens'])[0]:<9} "
              f"{str(r['exp_dup']) + ' -> ' + str(r['pred_dup']):<15} {'OK' if not miss else 'MISS ' + r['miss']}")

    # ---- summary
    ns = [r for r in rows if not r["exp_sens"]]
    cat_ok = sum(r["exp_cat"] == r["pred_cat"] for r in ns)
    route_ok = sum(OFFICE[r["exp_cat"]] == OFFICE.get(r["pred_cat"]) for r in ns)
    sev_exact = sum(r["exp_sev"] == r["pred_sev"] for r in ns)
    sev_close = sum(abs(r["exp_sev"] - r["pred_sev"]) <= 1 for r in ns)
    sens_ok = sum(r["exp_sens"] == r["pred_sens"] for r in rows)
    dups = [r for r in ns if r["exp_dup"] is not None]
    dup_ok = sum(r["pred_dup"] == r["exp_dup"] for r in dups)
    nondups = [r for r in ns if r["exp_dup"] is None]
    false_merges = sum(r["pred_dup"] is not None for r in nondups)
    route_pct = 100 * route_ok / len(ns) if ns else 0
    dup_pct = 100 * dup_ok / len(dups) if dups else 0

    print("\n================ RESULTS ================")
    print(f"Routing to the correct office : {pct(route_ok, len(ns))}   target 90%  -> {'PASS' if route_pct >= 90 else 'FAIL'}")
    print(f"Duplicates grouped correctly  : {pct(dup_ok, len(dups))}   target 85%  -> {'PASS' if dup_pct >= 85 else 'FAIL'}")
    print(f"Wrongly merged (false merges) : {false_merges} of {len(nondups)} non-duplicates (lower is better, aim for 0)")
    print(f"Exact category match          : {pct(cat_ok, len(ns))}")
    print(f"Severity exact / within 1     : {pct(sev_exact, len(ns))}  /  {pct(sev_close, len(ns))}")
    print(f"Sensitive detection           : {pct(sens_ok, len(rows))}  (serious cases must never be missed)")
    print(f"AI requests this run          : {calls['made']} new, {calls['cached']} from saved results")
    if any(r["fallback"] for r in rows):
        print("WARNING: some answers came from the safe default, not the AI. Fix the AI first.")

    with open("eval_results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print("\nFull results saved to eval_results.csv (open in Excel; look at the 'miss' column).")


if __name__ == "__main__":
    main()