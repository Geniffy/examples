// A support desk where every customer has a memory of their own.
//
// Each customer is a space. The same question gets each customer's own answer, or a plain "nothing
// stored" when that customer never mentioned it. What one customer said never reaches another.
//
//   node support-bot.mjs
//
// It forgets both customers at the end, the way you would when a customer asks to be forgotten.
import { Geniffy } from "geniffy";

// What each customer told your support team, as your helpdesk would hand it over.
const TICKETS = {
  example_customer_ana: [
    "Ana Ruiz says order #4417 arrived with a cracked lid. She wants a replacement, not a refund.",
    "Ana Ruiz asks to be contacted by email only, never by phone.",
  ],
  example_customer_ben: [
    "Ben Okafor is on the Team plan, which renews on 12 March.",
    "Ben Okafor asked whether single sign-on works with Okta.",
  ],
};

const QUESTIONS = [
  "What does this customer want done about their order?",
  "When does their plan renew?",
  "How should we contact them?",
];

const client = new Geniffy(); // reads GENIFFY_API_KEY

// Add every ticket first, then wait: Geniffy learns them all at the same time.
const added = [];
for (const [customer, notes] of Object.entries(TICKETS)) {
  const mem = client.space(customer);
  for (const text of notes) added.push([mem, await mem.memories.add({ text, title: "Support ticket" })]);
}

try {
  await Promise.all(added.map(([mem, source]) => mem.sources.wait(source.id)));

  // Which of your users hold memories, most recently written first.
  for (const row of await client.spaces()) {
    if (row.space in TICKETS) console.log(`${row.space}: ${row.memories} memories from ${row.sources} tickets`);
  }

  for (const customer of Object.keys(TICKETS)) {
    const mem = client.space(customer);
    console.log(`\n== ${customer}`);
    for (const question of QUESTIONS) {
      const answer = await mem.ask(question);
      console.log(`Q: ${question}`);
      console.log(`A: ${answer.answer ?? answer.message}`);
    }
  }
} finally {
  // The call to make when a customer asks to be forgotten.
  for (const customer of Object.keys(TICKETS)) await client.forgetSpace(customer);
}
