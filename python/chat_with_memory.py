"""Chat with Claude in your terminal, and it remembers you between runs.

Before each reply, what Geniffy knows that bears on your message goes into Claude's system prompt.
After each reply, the exchange goes into your memory, so the next run knows it too.

    export GENIFFY_API_KEY="gnf_live_..."
    export ANTHROPIC_API_KEY="sk-ant-..."
    python chat_with_memory.py             # tell it something about yourself, quit, run it again and ask
    python chat_with_memory.py --forget    # forget everything this chat has learned
"""
import os
import sys

from anthropic import Anthropic
from geniffy import Geniffy

MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-5-5")
SPACE = "example_chat"                  # in your app: one space per user, such as f"user_{user.id}"

SYSTEM = """You are a helpful assistant who remembers this user across conversations.

What you remember that bears on their message, each line with where it came from:
<memory>
{memory}
</memory>

Use what helps and ignore the rest. If it says nothing is stored, say you don't know rather than guess."""

geniffy = Geniffy()                     # reads GENIFFY_API_KEY
mem = geniffy.space(SPACE)

if "--forget" in sys.argv:
    geniffy.forget_space(SPACE)
    print("Forgot everything this chat had learned.")
    sys.exit()

claude = Anthropic()                    # reads ANTHROPIC_API_KEY
history = []
print("Chat with memory. Press Enter on an empty line to quit.\n")

try:
    while text := input("You: ").strip():
        history.append({"role": "user", "content": text})

        # Recall: the memories that bear on this message, written out for the prompt.
        system = SYSTEM.format(memory=mem.context(text))

        print("Claude: ", end="", flush=True)
        with claude.messages.stream(model=MODEL, max_tokens=2048, system=system, messages=history) as stream:
            for chunk in stream.text_stream:
                print(chunk, end="", flush=True)
            reply = stream.get_final_message()
        print("\n")

        said = "".join(block.text for block in reply.content if block.type == "text")
        history.append({"role": "assistant", "content": said})

        # Remember: add this exchange. It is learned in the background, so the chat never waits on it,
        # and who said what is kept, so what you say about yourself becomes a memory about you.
        mem.memories.add(messages=history[-2:], title="Chat")
except (EOFError, KeyboardInterrupt):    # Ctrl+D or Ctrl+C ends the chat
    print()
