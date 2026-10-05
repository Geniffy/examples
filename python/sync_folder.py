"""Keep a folder of documents in memory as it changes.

A company keeps its policies as files in a folder. Each file is added under its own path, so sending it
again updates the memory it already made: an unchanged policy costs nothing, an edited one teaches only what
changed, and one deleted from the folder goes from memory too, in one call at the end of each sync.

    python sync_folder.py

It works in a folder of its own, and forgets the memory at the end.
"""
import tempfile
from pathlib import Path

from geniffy import Geniffy

client = Geniffy()                      # reads GENIFFY_API_KEY
mem = client.space("example_acme_policies")
LABELS = {"channel": "policies"}
READS = {".pdf", ".docx", ".pptx", ".xlsx", ".txt", ".md", ".csv", ".html"}


def sync(folder: Path) -> None:
    """Every file in the folder that Geniffy can read, each under its own name; what has left the folder goes."""
    kept = set()
    for path in sorted(folder.iterdir()):
        if path.is_file() and path.suffix.lower() in READS:
            source = mem.memories.add_file(path.read_bytes(), filename=path.name, external_id=path.name, labels=LABELS)
            print(f"{path.name}: {mem.sources.wait(source.id).status}")
            kept.add(path.name)
    gone = mem.sources.delete_labelled(LABELS, keep=kept)
    print(f"{len(kept)} files in the folder; {gone} gone from it, and from memory.")


with tempfile.TemporaryDirectory() as tmp:
    folder = Path(tmp)
    (folder / "leave.md").write_text("Everyone gets 24 days of paid leave a year.", encoding="utf-8")
    (folder / "remote.md").write_text("Anyone can work from home two days a week.", encoding="utf-8")
    (folder / "travel.md").write_text("Book flights through the travel desk a week ahead.", encoding="utf-8")
    try:
        sync(folder)

        print("\nThe leave policy changes, and the travel policy is retired.")
        (folder / "leave.md").write_text("Everyone gets 26 days of paid leave a year.", encoding="utf-8")
        (folder / "travel.md").unlink()
        sync(folder)

        answer = mem.ask("How many days of paid leave do we get?")
        print("\n" + (answer.answer or answer.message))
    finally:
        client.forget_space("example_acme_policies")
