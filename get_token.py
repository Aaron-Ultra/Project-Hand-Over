"""
Prints a login token for a test user so you can call protected endpoints in /docs.
Usage:   python get_token.py student1@gmail.com yourpassword
Needs SUPABASE_URL and SUPABASE_ANON_KEY in .env  (anon / publishable key, NOT the service key)
The token expires after about 1 hour; just run the script again.
"""
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
if len(sys.argv) != 3:
    sys.exit("Usage: python get_token.py <email> <password>")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
res = sb.auth.sign_in_with_password({"email": sys.argv[1], "password": sys.argv[2]})
print("\nPaste this into the 'authorization' field in /docs (include the word Bearer):\n")
print("Bearer " + res.session.access_token)