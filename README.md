# The Red Door

Reverse engineering of `RED-DOOR.TAP`, a ZX Spectrum text adventure
(Tartan Software, Montrose — originally from their *6-in-1* compilation).

The goal here is the **data**, not the code: every room, description, object,
message, vocabulary word, exit and puzzle rule, in a form you can build a remake
from.

## Contents

| Path | What it is |
|---|---|
| `RED-DOOR.TAP` | the original tape image |
| `docs/GAME-DATA.md` | **the main reference** — map, all text, full puzzle analysis |
| `data/reddoor.json` | the same data, machine-readable |
| `basic/red.bas` | the game, detokenised |
| `basic/RedDoor.bas` | the loader and "Adventure Guide" intro, detokenised |
| `tools/extract_reddoor.py` | the extractor that produces all of the above |

## Regenerating

```
python3 tools/extract_reddoor.py RED-DOOR.TAP -o data/reddoor.json --basic-dir basic
```

No dependencies beyond the standard library.

## How the game is put together

The tape holds a BASIC loader, a 240-byte helper block, a **7112-byte headerless
machine-code block that loads at 58424** (the parser plus every data table), and
the main BASIC program. Game state lives in two byte arrays in the machine-code
region: flags at 64280 and object locations at 64379.

Commands are two words, matched on their first five letters, and dispatched with
`GO TO 1000 + verb*100`. Room descriptions are `GO SUB 7000 + 10*room`.

See `docs/GAME-DATA.md` §1 for the full memory map.

## Shape of the game

31 rooms (one unreachable), 35 objects (three unused), 51 verbs, ~113 nouns,
29 numbered messages. You wake in an Egyptian tomb after the titular red door
slams behind you, and have to satisfy two naked mummies, a soothsayer, a sphinx,
a spider, a concubine and finally Thoth himself — who wants a gift worthy of a
god, and gives you exactly three audiences to produce one.

Full walkthrough and dependency graph in `docs/GAME-DATA.md` §6.
