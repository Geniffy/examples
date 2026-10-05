"""Keep your own records in memory as they change, by their own ids.

A helpdesk's tickets grow, get answered and get closed. Each one is added under its own id, so sending it
again updates the memory it already made: unchanged costs nothing, a new reply is learned and nothing else
is, and a closed ticket is deleted by its id.

    python sync_records.py

It forgets the customer at the end.
"""
from geniffy import Geniffy, NotFoundError

client = Geniffy()                      # reads GENIFFY_API_KEY
mem = client.space("example_customer_ana")

# The tickets as your helpdesk holds them: an id, a subject, and the thread so far.
tickets = {
    "ticket-4417": ("Cracked lid on order #4417",
                    "Ana Ruiz says order #4417 arrived with a cracked lid. She wants a replacement."),
    "ticket-4420": ("Contact preferences",
                    "Ana Ruiz asks to be contacted by email only, never by phone."),
}


def sync(ticket_id: str) -> None:
    subject, thread = tickets[ticket_id]
    source = mem.memories.add(thread, title=subject, external_id=ticket_id)
    source = mem.sources.wait(source.id)
    print(f"{ticket_id}: {source.status}, {source.facts} memories")


try:
    for ticket_id in tickets:
        sync(ticket_id)

    print("\nSent again, unchanged: nothing is learned twice.")
    sync("ticket-4417")

    print("\nA reply arrives on the ticket: only the reply is learned.")
    subject, thread = tickets["ticket-4417"]
    tickets["ticket-4417"] = (subject, thread + "\n\nThe replacement lid shipped on 6 October by courier.")
    sync("ticket-4417")
    answer = mem.ask("When did the replacement lid ship?")
    print(answer.answer or answer.message)

    print("\nThe contact ticket is closed and deleted in the helpdesk, so it goes from memory too.")
    mem.sources.delete(external_id="ticket-4420")
    try:
        mem.sources.get(external_id="ticket-4420")
    except NotFoundError:
        print("ticket-4420: deleted, with what only it taught")
finally:
    client.forget_space("example_customer_ana")
