// A user asks what your app remembers about them, then asks to be forgotten.
//
// Their copy is everything held for them, current or not, each memory with its status and the sentence it came
// from, and every source. It is written to a file you can hand them. Then their memory is erased, and only theirs.
//
//     node user-data.mjs
import { writeFile } from "node:fs/promises";
import { Geniffy } from "geniffy";

const client = new Geniffy(); // reads GENIFFY_API_KEY
const mem = client.space("example_customer_meera");

for (const note of ["Meera approves every invoice above 2 lakh rupees.", "Meera prefers email to calls."]) {
  await mem.sources.wait((await mem.memories.add(note)).id);
}

const copy = await mem.export();
await writeFile("meera.json", JSON.stringify(copy, null, 2));
console.log(`Wrote meera.json: ${copy.memories.length} memories and ${copy.sources.length} sources, kept in ${copy.stored_in}.`);
for (const m of copy.memories) console.log(`- ${m.text} (${m.status})`);

await client.forgetSpace("example_customer_meera");
console.log("\nForgotten: everything held for this user is gone, and no other user's memory was touched.");
