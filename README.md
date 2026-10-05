<p align="center">
  <a href="https://geniffy.com"><img src="https://geniffy.com/brand/geniffy-lockup-ink.png" alt="Geniffy" height="44"></a>
</p>

# Geniffy examples

Small programs that give an app a memory with Geniffy. Each one runs on its own, is short enough to read
in a minute, and forgets what it wrote when it finishes, unless keeping it is the point.

[![Docs](https://img.shields.io/badge/docs-docs.geniffy.com-1A1814?style=flat-square)](https://docs.geniffy.com)
[![PyPI](https://img.shields.io/pypi/v/geniffy?style=flat-square&label=pypi)](https://pypi.org/project/geniffy/)
[![npm](https://img.shields.io/npm/v/geniffy?style=flat-square)](https://www.npmjs.com/package/geniffy)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

| Example | What it shows | Python | JavaScript |
| --- | --- | --- | --- |
| **Quickstart** | Remember something about one of your users, then recall it three ways: for your prompt, as an answer, and as ranked matches | [quickstart.py](python/quickstart.py) | [quickstart.mjs](javascript/quickstart.mjs) |
| **Support bot** | One memory per customer. The same question gets each customer's own answer, or a plain "nothing stored" | [support_bot.py](python/support_bot.py) | [support-bot.mjs](javascript/support-bot.mjs) |
| **Chat with memory** | A chat with Claude in your terminal that remembers you between runs | [chat_with_memory.py](python/chat_with_memory.py) | [chat-with-memory.mjs](javascript/chat-with-memory.mjs) |
| **Sync your records** | Tickets kept in step by their own ids: sent again, only what changed is learned; closed, deleted by id | [sync_records.py](python/sync_records.py) | [sync-records.mjs](javascript/sync-records.mjs) |
| **Sync a folder** | A folder of policies kept in memory: an edited file teaches only what changed, and a deleted one goes from memory in the same sync | [sync_folder.py](python/sync_folder.py) | [sync-folder.mjs](javascript/sync-folder.mjs) |
| **Keys for your users** | A key for one user's own app: it reaches only them, can expire, and stops when revoked | [user_keys.py](python/user_keys.py) | [user-keys.mjs](javascript/user-keys.mjs) |
| **Labels** | Label what comes in by channel and account, then keep recall to one of them | [labels.py](python/labels.py) | [labels.mjs](javascript/labels.mjs) |
| **A user's data** | A user asks for a copy of what you hold about them, then asks to be forgotten | [user_data.py](python/user_data.py) | [user-data.mjs](javascript/user-data.mjs) |

## Run them

Make a key in the [Geniffy app](https://geniffy.com/app) under **API keys**, then set it:

```bash
export GENIFFY_API_KEY="gnf_live_..."          # PowerShell: $env:GENIFFY_API_KEY = "gnf_live_..."
```

Python 3.10 or later:

```bash
cd python
pip install -r requirements.txt
python quickstart.py
```

Node.js 18 or later:

```bash
cd javascript
npm install
node quickstart.mjs
```

The chat example also needs an [Anthropic API key](https://platform.claude.com/) as `ANTHROPIC_API_KEY`. It uses
`claude-opus-5-5` unless you set `CLAUDE_MODEL`.

## The pattern behind all of them

Every example is the same three steps, around whatever your app already does:

```python
mem = client.space(f"user_{user.id}")             # 1. one memory per user; no other space can read it

mem.memories.add(messages=conversation)            # 2. remember what they tell you
context = mem.context(message)                     # 3. before your model answers, recall what bears on it
```

`context()` hands back the memories that bear on the question, one per line, each with where and when it
was said. When nothing does, it says so in a sentence instead of returning nothing, because a model reads
an empty block as permission to guess.

## More

- [Docs](https://docs.geniffy.com): keys and spaces, adding memories, recall, errors
- Python SDK: [Geniffy/geniffy-python](https://github.com/Geniffy/geniffy-python)
- TypeScript and JavaScript SDK: [Geniffy/geniffy-typescript](https://github.com/Geniffy/geniffy-typescript)
- Your memory in Claude, ChatGPT, Cursor and VS Code: [Geniffy/geniffy-mcp](https://github.com/Geniffy/geniffy-mcp)

Found a problem in an example? [Open an issue](https://github.com/Geniffy/examples/issues).
