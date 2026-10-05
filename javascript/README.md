# JavaScript examples

Node.js 18 or later. Make a key in the [Geniffy app](https://geniffy.com/app) under **API keys**.

```bash
npm install
export GENIFFY_API_KEY="gnf_live_..."

node quickstart.mjs            # remember something, then recall it three ways
node support-bot.mjs           # one memory per customer
node chat-with-memory.mjs      # Claude that remembers you between runs; also needs ANTHROPIC_API_KEY
node sync-records.mjs          # your own records, kept in step by their own ids
node user-keys.mjs             # a key for one user's own app, that reaches only them
node labels.mjs                # label what you add, then keep recall to a label
```

`chat-with-memory.mjs` keeps what it learns, so you can quit and come back. `node chat-with-memory.mjs
--forget` clears it. The others forget what they wrote when they finish.

The same code works in TypeScript. SDK reference: [Geniffy/geniffy-typescript](https://github.com/Geniffy/geniffy-typescript)
and [docs.geniffy.com/sdks/typescript](https://docs.geniffy.com/sdks/typescript).
