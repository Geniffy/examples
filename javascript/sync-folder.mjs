// Keep a folder of documents in memory as it changes.
//
// A company keeps its policies as files in a folder. Each file is added under its own path, so sending it
// again updates the memory it already made: an unchanged policy costs nothing, an edited one teaches only what
// changed, and one deleted from the folder goes from memory too, in one call at the end of each sync.
//
//     node sync-folder.mjs
//
// It works in a folder of its own, and forgets the memory at the end.
import { mkdtemp, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { Geniffy } from "geniffy";

const client = new Geniffy(); // reads GENIFFY_API_KEY
const mem = client.space("example_acme_policies");
const LABELS = { channel: "policies" };
const READS = new Set([".pdf", ".docx", ".pptx", ".xlsx", ".txt", ".md", ".csv", ".html"]);

// Every file in the folder that Geniffy can read, each under its own name; what has left the folder goes.
async function sync(folder) {
  const kept = [];
  const files = (await readdir(folder, { withFileTypes: true })).filter((e) => e.isFile()).map((e) => e.name).sort();
  for (const name of files) {
    if (!READS.has(extname(name).toLowerCase())) continue;
    const source = await mem.memories.addFile(await readFile(join(folder, name)), { filename: name, externalId: name, labels: LABELS });
    console.log(`${name}: ${(await mem.sources.wait(source.id)).status}`);
    kept.push(name);
  }
  const gone = await mem.sources.deleteLabelled(LABELS, { keep: kept });
  console.log(`${kept.length} files in the folder; ${gone} gone from it, and from memory.`);
}

const folder = await mkdtemp(join(tmpdir(), "policies-"));
try {
  await writeFile(join(folder, "leave.md"), "Everyone gets 24 days of paid leave a year.");
  await writeFile(join(folder, "remote.md"), "Anyone can work from home two days a week.");
  await writeFile(join(folder, "travel.md"), "Book flights through the travel desk a week ahead.");
  await sync(folder);

  console.log("\nThe leave policy changes, and the travel policy is retired.");
  await writeFile(join(folder, "leave.md"), "Everyone gets 26 days of paid leave a year.");
  await unlink(join(folder, "travel.md"));
  await sync(folder);

  const answer = await mem.ask("How many days of paid leave do we get?");
  console.log("\n" + (answer.answer ?? answer.message));
} finally {
  await client.forgetSpace("example_acme_policies");
  await rm(folder, { recursive: true, force: true });
}
