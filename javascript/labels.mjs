// Label what you add, then keep recall to a label.
//
// One customer's memory holds what came in by email and by chat, about two of their accounts. Each source
// carries labels of your own, so context, search and the memory list can keep to one account or one channel.
//
//     node labels.mjs
//
// It forgets the customer at the end.
import { Geniffy } from "geniffy";

const client = new Geniffy(); // reads GENIFFY_API_KEY
const mem = client.space("example_customer_devika");

const added = [
  await mem.memories.add({ text: "The Lumen renewal comes up in March, and Priya Nair signs it.", title: "Lumen renewal",
    labels: { channel: "email", account: "lumen" } }),
  await mem.memories.add({ text: "Lumen is billed per seat, and Devika asked for one annual invoice.", title: "Billing chat",
    labels: { channel: "chat", account: "lumen" } }),
  await mem.memories.add({ text: "The Acme renewal comes up in June, and Arjun Mehta signs it.", title: "Acme renewal",
    labels: { channel: "email", account: "acme" } }),
];

try {
  for (const source of added) await mem.sources.wait(source.id);

  const question = "When does the renewal come up, and who signs it?";
  console.log("Only the Lumen account:");
  console.log(await mem.context(question, { labels: { account: "lumen" } }));

  console.log("\nOnly the Acme account:");
  console.log(await mem.context(question, { labels: { account: "acme" } }));

  console.log("\nWhat came in by chat:");
  for (const m of (await mem.memories.list({ labels: { channel: "chat" } })).memories) console.log("-", m.text);

  console.log("\nA label nothing carries:");
  console.log(await mem.context(question, { labels: { account: "zeta" } }));
} finally {
  await client.forgetSpace("example_customer_devika");
}
