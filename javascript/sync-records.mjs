// Keep your own records in memory as they change, by their own ids.
//
// A helpdesk's tickets grow, get answered and get closed. Each one is added under its own id, so sending it
// again updates the memory it already made: unchanged costs nothing, a new reply is learned and nothing else
// is, and a closed ticket is deleted by its id.
//
//     node sync-records.mjs
//
// It forgets the customer at the end.
import { Geniffy, NotFoundError } from "geniffy";

const client = new Geniffy(); // reads GENIFFY_API_KEY
const mem = client.space("example_customer_ana");

// The tickets as your helpdesk holds them: an id, a subject, and the thread so far.
const tickets = {
  "ticket-4417": ["Cracked lid on order #4417",
    "Ana Ruiz says order #4417 arrived with a cracked lid. She wants a replacement."],
  "ticket-4420": ["Contact preferences", "Ana Ruiz asks to be contacted by email only, never by phone."],
};

async function sync(ticketId) {
  const [title, thread] = tickets[ticketId];
  const added = await mem.memories.add({ text: thread, title, externalId: ticketId });
  const source = await mem.sources.wait(added.id);
  console.log(`${ticketId}: ${source.status}, ${source.facts} memories`);
}

try {
  for (const ticketId of Object.keys(tickets)) await sync(ticketId);

  console.log("\nSent again, unchanged: nothing is learned twice.");
  await sync("ticket-4417");

  console.log("\nA reply arrives on the ticket: only the reply is learned.");
  const [title, thread] = tickets["ticket-4417"];
  tickets["ticket-4417"] = [title, `${thread}\n\nThe replacement lid shipped on 6 October by courier.`];
  await sync("ticket-4417");
  const answer = await mem.ask("When did the replacement lid ship?");
  console.log(answer.answer ?? answer.message);

  console.log("\nThe contact ticket is closed and deleted in the helpdesk, so it goes from memory too.");
  await mem.sources.delete({ externalId: "ticket-4420" });
  try {
    await mem.sources.get({ externalId: "ticket-4420" });
  } catch (err) {
    if (!(err instanceof NotFoundError)) throw err;
    console.log("ticket-4420: deleted, with what only it taught");
  }
} finally {
  await client.forgetSpace("example_customer_ana");
}
