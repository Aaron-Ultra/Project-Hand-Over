"""
Finds which Gemini models still have free quota for your key.
Run (venv active, in the hostel-backend folder):   python test_models.py
Uses 1 request per model. Free quota is counted per model, so a model that works here
can be added to LLM_MODEL in .env (comma separated) as a backup.
"""
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.environ["LLM_API_KEY"], base_url=os.environ["LLM_BASE_URL"])

CANDIDATES = [
    "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.7-flash", "gemini-3.6-flash",
    "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-2.5-flash-lite",
    "gemini-flash-latest", "gemini-flash-lite-latest",
]

working = []
for m in CANDIDATES:
    try:
        r = client.chat.completions.create(model=m, messages=[{"role": "user", "content": "Say hi."}])
        print(f"OK      {m:28} -> {(r.choices[0].message.content or '').strip()[:30]!r}")
        working.append(m)
    except Exception as e:  # noqa: BLE001
        text = str(e)
        reason = "quota used up (429)" if "429" in text else "not available (404)" if "404" in text else text[:80]
        print(f"FAILED  {m:28} -> {reason}")

print()
if working:
    print("Paste this line into .env (replace the old LLM_MODEL line):")
    print("LLM_MODEL=" + ",".join(working))
else:
    print("No model worked. Free quota is used up for today; see the other options in the chat.")