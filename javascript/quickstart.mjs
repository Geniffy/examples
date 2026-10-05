// Remember something about one of your users, then recall it three ways.
//
//   npm install
//   export GENIFFY_API_KEY="gnf_live_..."
//   node quickstart.mjs
//
// It writes into a space of its own and forgets it at the end, so your memory is left as it was.
import { Geniffy } from "geniffy";

const SPACE = "example_quickstart"; // in your app: one space per user, such as `user_${user.id}`

const client = new Geniffy(); // reads GENIFFY_API_KEY
const mem = client.space(SPACE); // this user's memory; no other space can read it

// Remember. Geniffy reads the note and keeps each fact in it as a memory of its own.
let source = await mem.memories.add({
  text:
    "Priya Nair signs the Lumen renewal. It comes up in March, and she wants the security " +
    "review finished before she signs.",
  title: "Call with Priya",
});

try {
  source = await mem.sources.wait(source.id); // learning usually takes a few seconds
  if (source.status !== "learned") throw new Error(`Not learned yet: ${source.error ?? source.status}`);
  console.log(`Learned ${source.facts} memories from "${source.title}".\n`);

  // 1. For your own prompt: the memories that bear on a question, each with where it came from.
  console.log("context()");
  console.log(`${await mem.context("Who signs the Lumen renewal?")}\n`);

  // 2. As an answer in words. When nothing supports one, answer is null and message says why.
  const answer = await mem.ask("What does Priya want done before she signs?");
  console.log("ask()");
  console.log(`${answer.answer ?? answer.message}\n`);

  // 3. Raw: the best matches, ranked. search() does not judge relevance, so it always returns some.
  console.log("search()");
  for (const memory of await mem.search("Lumen renewal", { limit: 3 })) {
    console.log(`#${memory.id}  ${memory.text}`);
  }

  // Ask about something that was never stored and you get a sentence saying so, never a guess.
  console.log("\ncontext(), about something never stored");
  console.log(await mem.context("What is Priya's home address?"));
} finally {
  await client.forgetSpace(SPACE); // everything held for this user, gone
}
