// Chat with Claude in your terminal, and it picks up where you left off between runs.
//
// Before each reply, your briefing goes into Claude's system prompt: what happened in earlier chats, the rules
// you set, and what is known that bears on your message, each line dated. Each turn is saved as you go, into one
// memory for the whole chat, so the next run knows it too.
//
//   export GENIFFY_API_KEY="gnf_live_..."
//   export ANTHROPIC_API_KEY="sk-ant-..."
//   node chat-with-memory.mjs            # tell it something about yourself, quit, run it again and ask
//   node chat-with-memory.mjs --forget   # forget everything this chat has learned
import Anthropic from "@anthropic-ai/sdk";
import { Geniffy } from "geniffy";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";
const SPACE = "example_chat"; // in your app: one space per user, such as `user_${user.id}`

const SYSTEM = (memory) => `You are a helpful assistant who remembers this user across conversations.

What you remember: what happened before, the rules they set, and what is known that bears on their message, each
line dated:
<memory>
${memory}
</memory>

Use what helps and ignore the rest. If it doesn't cover something, say you don't know rather than guess.`;

const geniffy = new Geniffy(); // reads GENIFFY_API_KEY
const mem = geniffy.space(SPACE);

if (process.argv.includes("--forget")) {
  await geniffy.forgetSpace(SPACE);
  console.log("Forgot everything this chat had learned.");
  process.exit(0);
}

const claude = new Anthropic(); // reads ANTHROPIC_API_KEY
const chat = mem.session(`chat-${randomUUID().slice(0, 12)}`, { title: "Chat" }); // this run of the chat: one memory
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

  // Recall: the briefing, with your message as the cue, so what bears on it comes first.
  const system = SYSTEM((await mem.briefing({ cue: text })) || "Nothing is remembered about this user yet.");

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

  // Remember: only what is new since the last save is sent, into this chat's one memory. It is learned in the
  // background, so the chat never waits on it, and who said what is kept, so what you say about yourself
  // becomes a memory about you.
  await chat.save(history);
  rl.prompt();
}
