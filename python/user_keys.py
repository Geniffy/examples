"""Give one of your users' own apps a key that reaches only them.

Your key reaches every one of your users, so it stays on your server. A user's phone or desktop app gets a
key limited to that user instead: it reads and writes their memory and nothing else, it can be made to
expire, and you can revoke it at any time.

    python user_keys.py

It forgets both users at the end.
"""
from datetime import date, timedelta

from geniffy import Geniffy, GeniffyError

server = Geniffy()                      # your key, from GENIFFY_API_KEY: never leaves your server
server.space("example_user_ben").memories.add("Ben Okafor's plan renews on 12 March.")

# On your server: a key for Ana's phone, good for a week.
key = server.space("example_user_ana").keys.create(name="Ana's phone", expires_at=date.today() + timedelta(days=7))
print(f"Made {key.name}: limited to {key.space}, stops after {key.expires_at}")

# On Ana's phone: the key reaches Ana's memory, with no space to name.
phone = Geniffy(api_key=key.key)
source = phone.memories.add("I'm vegetarian, and I prefer WhatsApp to email.")
phone.sources.wait(source.id)
answer = phone.ask("Does Ana prefer WhatsApp or email?")
print("Ana's phone asks:", answer.answer or answer.message)

try:
    phone.space("example_user_ben").context("When does the plan renew?")
except GeniffyError as e:
    print(f"Ana's phone asking about Ben: refused ({e.code})")

try:
    # On your server, when Ana signs out of the phone: the key stops at once.
    server.space("example_user_ana").keys.revoke(key.id)
    phone.me()
except GeniffyError as e:
    print(f"After revoking: {e.code}")
finally:
    server.forget_space("example_user_ana")    # erasing a user stops their keys too
    server.forget_space("example_user_ben")
