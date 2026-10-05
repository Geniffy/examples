// Chat with Claude in your terminal, and it remembers you between runs.
//
// Before each reply, what Geniffy knows that bears on your message goes into Claude's system prompt.
// After each reply, the exchange goes into your memory, so the next run knows it too.
//
//   export GENIFFY_API_KEY="gnf_live_..."
//   export ANTHROPIC_API_KEY="sk-ant-..."
//   node chat-with-memory.mjs            # tell it something about yourself, quit, run it again and ask
//   node chat-with-memory.mjs --forget   # forget everything this chat has learned
import Anthropic from "@anthropic-ai/sdk";
import { Geniffy } from "geniffy";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";
const SPACE = "example_chat"; // in your app: one space per user, such as `user_${user.id}`

const SYSTEM = (memory) => `You are a helpful assistant who remembers this user across conversations.

What you remember that bears on their message, each line with where it came from:
<memory>
${memory}
</memory>

Use what helps and ignore the rest. If it says nothing is stored, say you don't know rather than guess.`;

const geniffy = new Geniffy(); // reads GENIFFY_API_KEY
const mem = geniffy.space(SPACE);

if (process.argv.includes("--forget")) {
  await geniffy.forgetSpace(SPACE);
  console.log("Forgot everything this chat had learned.");
  process.exit(0);
}

const claude = new Anthropic(); // reads ANTHROPIC_API_KEY
const history = [];
const rl = createInterface({ input: stdin, output: stdout, prompt: "You: " });
rl.on("SIGINT", () => rl.close()); // Ctrl+C ends the chat
console.log("Chat with memory. Press Enter on an empty line to quit.\n");

rl.prompt();
for await (const line of rl) {
  // Lines typed while Claude is still answering wait their turn here instead of being dropped.
  const text = line.trim();
  if (!text) break;
  history.push({ role: "user", content: text });

  // Recall: the memories that bear on this message, written out for the prompt.
  const system = SYSTEM(await mem.context(text));

  stdout.write("Claude: ");
  const stream = claude.messages.stream({ model: MODEL, max_tokens: 2048, system, messages: history });
  stream.on("text", (delta) => stdout.write(delta));
  const reply = await stream.finalMessage();
  stdout.write("\n\n");

  const said = reply.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  history.push({ role: "assistant", content: said });

  // Remember: add this exchange. It is learned in the background, so the chat never waits on it, and
  // who said what is kept, so what you say about yourself becomes a memory about you.
  await mem.memories.add({ messages: history.slice(-2), title: "Chat" });
  rl.prompt();
}
