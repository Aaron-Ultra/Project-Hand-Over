import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
base = os.getenv("LLM_BASE_URL", "")
key = os.getenv("LLM_API_KEY", "")
model = os.getenv("LLM_MODEL", "")

print("LLM_BASE_URL :", base)
print("LLM_MODEL    :", model)
print("LLM_API_KEY  :", (key[:4] + "..." + key[-3:]) if key else "(missing!)", f"(length {len(key)})")
print()

client = OpenAI(api_key=key, base_url=base)

print("1) Asking the model to say hi ...")
try:
    r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": "Say hi in 3 words."}])
    print("   OK ->", r.choices[0].message.content)
except Exception as e:
    print("   FAILED ->", type(e).__name__)
    print("  ", str(e)[:600])

print("\n2) Models your key can use ...")
try:
    names = sorted(m.id for m in client.models.list())
    for n in names:
        if "gemini" in n.lower():
            print("  ", n)
    if not names:
        print("   (none returned)")
except Exception as e:
    print("   FAILED ->", type(e).__name__)
    print("  ", str(e)[:600])