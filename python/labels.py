"""Label what you add, then keep recall to a label.

One customer's memory holds what came in by email and by chat, about two of their accounts. Each source
carries labels of your own, so context, search and the memory list can keep to one account or one channel.

    python labels.py

It forgets the customer at the end.
"""
from geniffy import Geniffy

client = Geniffy()                      # reads GENIFFY_API_KEY
mem = client.space("example_customer_devika")

added = [
    mem.memories.add("The Lumen renewal comes up in March, and Priya Nair signs it.", title="Lumen renewal",
                     labels={"channel": "email", "account": "lumen"}),
    mem.memories.add("Lumen is billed per seat, and Devika asked for one annual invoice.", title="Billing chat",
                     labels={"channel": "chat", "account": "lumen"}),
    mem.memories.add("The Acme renewal comes up in June, and Arjun Mehta signs it.", title="Acme renewal",
                     labels={"channel": "email", "account": "acme"}),
]

try:
    for source in added:
        mem.sources.wait(source.id)

    question = "When does the renewal come up, and who signs it?"
    print("Only the Lumen account:")
    print(mem.context(question, labels={"account": "lumen"}))

    print("\nOnly the Acme account:")
    print(mem.context(question, labels={"account": "acme"}))

    print("\nWhat came in by chat:")
    for m in mem.memories.list(labels={"channel": "chat"}).memories:
        print("-", m.text)

    print("\nA label nothing carries:")
    print(mem.context(question, labels={"account": "zeta"}))
finally:
    client.forget_space("example_customer_devika")
