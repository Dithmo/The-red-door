# The Red Door

Reverse engineering of `RED-DOOR.TAP`, a ZX Spectrum text adventure
(Tartan Software, Montrose — originally from their *6-in-1* compilation).

The goal here is the **data**, not the code: every room, description, object,
message, vocabulary word, exit and puzzle rule, in a form you can build a remake
from.

A remake is now being built on top of that data — a static TypeScript web app with
a picture for every location and a parser that actually understands English.

## Contents

### Reverse engineering

| Path | What it is |
|---|---|
| `RED-DOOR.TAP` | the original tape image |
| `docs/GAME-DATA.md` | **the main reference** — map, all text, full puzzle analysis |
| `data/reddoor.json` | the same data, machine-readable |
| `basic/red.bas` | the game, detokenised |
| `basic/RedDoor.bas` | the loader and "Adventure Guide" intro, detokenised |
| `tools/extract_reddoor.py` | the extractor that produces all of the above |

### Remake

| Path | What it is |
|---|---|
| `src/data/` | generated game data (`rooms`, `objects`, `lexicon`, `messages`, `flags`) |
| `src/engine/` | world state, conditions, effects, rule matching, turn loop, save/undo |
| `src/rules/` | the rule table — **hand-authored**, transcribed from the BASIC |
| `src/main.ts` | data-review harness — browse every room, toggle its flags, see each picture |
| `assets/images/` | one placeholder per image slot, tinted with that room's original ink |
| `tools/build_gamedata.py` | turns `data/reddoor.json` into `src/data/*.json` |
| `tools/make_placeholders.py` | generates placeholder artwork for every image slot |
| `tests/data.test.ts` | consistency checks on the ported data |
| `tests/engine.test.ts` | engine behaviour and a rule-table audit |

`src/rules/rules.json` is the one hand-authored data file: the original encodes
its puzzle logic in control flow rather than a table, so it has to be transcribed.
Every rule carries an `origin` naming the BASIC line it came from, and the test
suite checks those references and flags rules that can never fire. Transcription
is in progress — currently the movement guards, the mummy-case sequence and the
snake-pit.

Nothing under `src/data/` is hand-edited — it is all generated. `npm run data`
rebuilds it. Real artwork replaces the placeholder of the same filename;
`make_placeholders.py` never overwrites an existing file without `--force`.

## Running it

```
npm install
npm run data      # regenerate game data + placeholder art (needs python3)
npm run dev       # data-review harness at localhost:5173
npm test          # data consistency checks
npm run typecheck
```

The extractor itself needs no dependencies beyond the Python standard library:

```
python3 tools/extract_reddoor.py RED-DOOR.TAP -o data/reddoor.json --basic-dir basic
```

## How the game is put together

The tape holds a BASIC loader, a 240-byte helper block, a **7112-byte headerless
machine-code block that loads at 58424** (the parser plus every data table), and
the main BASIC program. Game state lives in two byte arrays in the machine-code
region: flags at 64280 and object locations at 64379.

Commands are two words, matched on their first five letters, and dispatched with
`GO TO 1000 + verb*100`. Room descriptions are `GO SUB 7000 + 10*room`.

See `docs/GAME-DATA.md` §1 for the full memory map.

## Shape of the game

31 rooms (one of them fatal), 35 objects (three unused), 51 verbs, ~113 nouns,
29 numbered messages. You wake in an Egyptian tomb after the titular red door
slams behind you, and have to satisfy two naked mummies, a soothsayer, a sphinx,
a spider, a concubine and finally Thoth himself — who wants a gift worthy of a
god, and gives you exactly three audiences to produce one.

Full walkthrough and dependency graph in `docs/GAME-DATA.md` §6.
