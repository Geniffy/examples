// Give one of your users' own apps a key that reaches only them.
//
// Your key reaches every one of your users, so it stays on your server. A user's phone or desktop app gets a
// key limited to that user instead: it reads and writes their memory and nothing else, it can be made to
// expire, and you can revoke it at any time.
//
//     node user-keys.mjs
//
// It forgets both users at the end.
import { Geniffy, GeniffyError } from "geniffy";

const server = new Geniffy(); // your key, from GENIFFY_API_KEY: never leaves your server
await server.space("example_user_ben").memories.add("Ben Okafor's plan renews on 12 March.");

// On your server: a key for Ana's phone, good for a week.
const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const key = await server.space("example_user_ana").keys.create({ name: "Ana's phone", expiresAt: week });
console.log(`Made ${key.name}: limited to ${key.space}, stops after ${key.expires_at}`);

// On Ana's phone: the key reaches Ana's memory, with no space to name.
const phone = new Geniffy({ apiKey: key.key });
const source = await phone.memories.add("I'm vegetarian, and I prefer WhatsApp to email.");
await phone.sources.wait(source.id);
const answer = await phone.ask("Does Ana prefer WhatsApp or email?");
console.log("Ana's phone asks:", answer.answer ?? answer.message);

try {
  await phone.space("example_user_ben").context("When does the plan renew?");
} catch (err) {
  if (!(err instanceof GeniffyError)) throw err;
  console.log(`Ana's phone asking about Ben: refused (${err.code})`);
}

try {
  // On your server, when Ana signs out of the phone: the key stops at once.
  await server.space("example_user_ana").keys.revoke(key.id);
  await phone.me();
} catch (err) {
  if (!(err instanceof GeniffyError)) throw err;
  console.log(`After revoking: ${err.code}`);
} finally {
  await server.forgetSpace("example_user_ana"); // erasing a user stops their keys too
  await server.forgetSpace("example_user_ben");
}
