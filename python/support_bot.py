"""A support desk where every customer has a memory of their own.

Each customer is a space. The same question gets each customer's own answer, or a plain "nothing
stored" when that customer never mentioned it. What one customer said never reaches another.

    python support_bot.py

It forgets both customers at the end, the way you would when a customer asks to be forgotten.
"""
from geniffy import Geniffy

# What each customer told your support team, as your helpdesk would hand it over.
TICKETS = {
    "example_customer_ana": [
        "Ana Ruiz says order #4417 arrived with a cracked lid. She wants a replacement, not a refund.",
        "Ana Ruiz asks to be contacted by email only, never by phone.",
    ],
    "example_customer_ben": [
        "Ben Okafor is on the Team plan, which renews on 12 March.",
        "Ben Okafor asked whether single sign-on works with Okta.",
    ],
}

QUESTIONS = [
    "What does this customer want done about their order?",
    "When does their plan renew?",
    "How should we contact them?",
]

client = Geniffy()                      # reads GENIFFY_API_KEY

# Add every ticket first, then wait: Geniffy learns them all at the same time.
added = []
for customer, notes in TICKETS.items():
    mem = client.space(customer)
    added += [(mem, mem.memories.add(note, title="Support ticket")) for note in notes]

try:
    for mem, source in added:
        mem.sources.wait(source.id)

    for row in client.spaces():         # which of your users hold memories, most recently written first
        if row["space"] in TICKETS:
            print(f"{row['space']}: {row['memories']} memories from {row['sources']} tickets")

    for customer in TICKETS:
        mem = client.space(customer)
        print(f"\n== {customer}")
        for question in QUESTIONS:
            answer = mem.ask(question)
            print(f"Q: {question}")
            print(f"A: {answer.answer or answer.message}")
finally:
    for customer in TICKETS:
        client.forget_space(customer)   # the call to make when a customer asks to be forgotten
