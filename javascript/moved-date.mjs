// A plan that moves. A customer says the launch is on 10 December; on a later call they move it to 17 December.
// The memory then holds one launch date, the 17th, and keeps the 10th as history.
//
//     node moved-date.mjs
//
// It forgets the customer at the end, the way you would when a customer asks to be forgotten.
import { Geniffy } from "geniffy";

const CALLS = [
  ["2026-10-14T09:00:00Z", "Hi, it's Asha from Kestrel Foods. Our launch is on 10 December.",
   "Noted, Asha: the launch is on 10 December."],
  ["2026-10-16T09:00:00Z", "Change of plan: we moved the launch from 10 December to 17 December.",
   "Got it: the launch is now on 17 December."],
];

const client = new Geniffy();                     // reads GENIFFY_API_KEY
const mem = client.space("example_customer_asha");

try {
  for (const [saidAt, said, reply] of CALLS) {
    const source = await mem.memories.add({
      messages: [{ role: "user", content: said }, { role: "assistant", content: reply }],
      title: "Call",
      saidAt,
    });
    await mem.sources.wait(source.id);            // learned, so the next step reads it
  }
  console.log("What the memory holds about the launch now:");
  for (const m of await mem.search("when is the launch", { limit: 5 })) console.log(`  ${m.text}`);
  console.log("\nWhat an agent opens its next call with:");
  for (const line of (await mem.briefing({ cue: "Asha asks when the launch is" })).split("\n")) {
    if (line.toLowerCase().includes("launch")) console.log(`  ${line.trim()}`);
  }
} finally {
  await client.forgetSpace("example_customer_asha");
}
