"""A user asks what your app remembers about them, then asks to be forgotten.

Their copy is everything held for them, current or not, each memory with its status and the sentence it came
from, and every source. It is written to a file you can hand them. Then their memory is erased, and only theirs.

    python user_data.py
"""
import json

from geniffy import Geniffy

client = Geniffy()                      # reads GENIFFY_API_KEY
mem = client.space("example_customer_meera")

for note in ("Meera approves every invoice above 2 lakh rupees.", "Meera prefers email to calls."):
    mem.sources.wait(mem.memories.add(note).id)

copy = mem.export()
with open("meera.json", "w", encoding="utf-8") as f:
    json.dump(copy, f, indent=2, ensure_ascii=False)
print(f"Wrote meera.json: {len(copy['memories'])} memories and {len(copy['sources'])} sources, kept in {copy['stored_in']}.")
for m in copy["memories"]:
    print(f"- {m['text']} ({m['status']})")

client.forget_space("example_customer_meera")
print("\nForgotten: everything held for this user is gone, and no other user's memory was touched.")
