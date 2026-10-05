"""Remember something about one of your users, then recall it three ways.

    pip install -r requirements.txt
    export GENIFFY_API_KEY="gnf_live_..."
    python quickstart.py

It writes into a space of its own and forgets it at the end, so your memory is left as it was.
"""
from geniffy import Geniffy

SPACE = "example_quickstart"            # in your app: one space per user, such as f"user_{user.id}"

client = Geniffy()                      # reads GENIFFY_API_KEY
mem = client.space(SPACE)               # this user's memory; no other space can read it

# Remember. Geniffy reads the note and keeps each fact in it as a memory of its own.
source = mem.memories.add(
    "Priya Nair signs the Lumen renewal. It comes up in March, and she wants the security "
    "review finished before she signs.",
    title="Call with Priya",
)

try:
    source = mem.sources.wait(source.id)    # learning usually takes a few seconds
    if source.status != "learned":
        raise SystemExit(f"Not learned yet: {source.error or source.status}")
    print(f'Learned {source.facts} memories from "{source.title}".\n')

    # 1. For your own prompt: the memories that bear on a question, each with where it came from.
    print("context()")
    print(mem.context("Who signs the Lumen renewal?"), end="\n\n")

    # 2. As an answer in words. When nothing supports one, .answer is None and .message says why.
    answer = mem.ask("What does Priya want done before she signs?")
    print("ask()")
    print(answer.answer or answer.message, end="\n\n")

    # 3. Raw: the best matches, ranked. search() does not judge relevance, so it always returns some.
    print("search()")
    for memory in mem.search("Lumen renewal", limit=3):
        print(f"#{memory.id}  {memory.text}")

    # Ask about something that was never stored and you get a sentence saying so, never a guess.
    print("\ncontext(), about something never stored")
    print(mem.context("What is Priya's home address?"))
finally:
    client.forget_space(SPACE)          # everything held for this user, gone
