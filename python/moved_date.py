"""A plan that moves. A customer says the launch is on 10 December; on a later call they move it to 17 December.
The memory then holds one launch date, the 17th, and keeps the 10th as history.

    python moved_date.py

It forgets the customer at the end, the way you would when a customer asks to be forgotten.
"""
from geniffy import Geniffy

CALLS = [
    ("2026-10-14T09:00:00Z", "Hi, it's Asha from Kestrel Foods. Our launch is on 10 December.",
     "Noted, Asha: the launch is on 10 December."),
    ("2026-10-16T09:00:00Z", "Change of plan: we moved the launch from 10 December to 17 December.",
     "Got it: the launch is now on 17 December."),
]

client = Geniffy()                      # reads GENIFFY_API_KEY
mem = client.space("example_customer_asha")

try:
    for when, said, reply in CALLS:
        source = mem.memories.add(messages=[{"role": "user", "content": said},
                                            {"role": "assistant", "content": reply}],
                                  title="Call", said_at=when)
        mem.sources.wait(source.id)     # learned, so the next step reads it
    print("What the memory holds about the launch now:")
    for m in mem.search("when is the launch", limit=5):
        print(f"  {m.text}")
    print("\nWhat an agent opens its next call with:")
    for line in mem.briefing(cue="Asha asks when the launch is").splitlines():
        if "launch" in line.lower():
            print(f"  {line.strip()}")
finally:
    client.forget_space("example_customer_asha")
