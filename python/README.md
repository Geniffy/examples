# Python examples

Python 3.10 or later. Make a key in the [Geniffy app](https://geniffy.com/app) under **API keys**.

```bash
pip install -r requirements.txt
export GENIFFY_API_KEY="gnf_live_..."

python quickstart.py           # remember something, then recall it three ways
python support_bot.py          # one memory per customer
python chat_with_memory.py     # Claude that remembers you between runs; also needs ANTHROPIC_API_KEY
python sync_records.py         # your own records, kept in step by their own ids
python user_keys.py            # a key for one user's own app, that reaches only them
```

`chat_with_memory.py` keeps what it learns, so you can quit and come back. `python chat_with_memory.py
--forget` clears it. The others forget what they wrote when they finish.

SDK reference: [Geniffy/geniffy-python](https://github.com/Geniffy/geniffy-python) and
[docs.geniffy.com/sdks/python](https://docs.geniffy.com/sdks/python).
