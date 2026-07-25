# The Red Door — complete game data

Reverse-engineered from `RED-DOOR.TAP`. Everything below is extracted from the tape
image; nothing is guessed. Regenerate the machine-readable form with:

```
python3 tools/extract_reddoor.py RED-DOOR.TAP -o data/reddoor.json --basic-dir basic
```

* `data/reddoor.json` — all tables, machine-readable
* `basic/red.bas`, `basic/RedDoor.bas` — detokenised BASIC listings
* `docs/GAME-DATA.md` — this file

---

## 1. How the tape is built

| Block | Kind | Name | Load address | Notes |
|---|---|---|---|---|
| 0–1 | BASIC | `RedDoor` | — | Loader + "Adventure Guide" intro pages, publisher blurb |
| 2–3 | CODE | `code` | 23300 (240 bytes) | Printer/scroll helpers used by the loader only |
| 4 | CODE | *(headerless)* | **58424–65535** (7112 bytes) | The engine: parser, vocabulary, all tables |
| 5–6 | BASIC | `red` | — | The game itself (`RUN 9900`), 33137 bytes + 892 bytes of saved variables |

The loader does `CLEAR 58423`, so the headerless block occupies everything above
RAMTOP. The main BASIC program is saved *with its variables*, which is where all
the single-letter constants come from — there is no initialisation code for them.

### Engine entry points (values of the saved variables)

| Name | Address | Purpose |
|---|---|---|
| `f` | 64280 | Game state array. `PEEK f` = current room; `PEEK (f+n)` = flag *n* |
| `o` | 64379 | Object location array. `PEEK (o+n)` = where object *n* is |
| `o+0` (`f+99`) | 64379 | Number of objects carried |
| — | 64114 / 64115 | Parser output: verb code / noun code |
| `dmov` | 62529 | Room exit table |
| — | 62751 / 63680 | Noun table / verb table |
| `prms` | 59419 | Print numbered message (number in 23500) |
| `pro` | 60790 | Print the "Here you can see" object list |
| `prhy` | 62358 | Scan objects present, set `pbs` |
| `pbs` | 65223 | Non-zero if any object is visible here |
| `sys` | 62485 | Prompt "What to do now?", read and parse input |
| `bl` | 62320 | Border/ink colour byte poked by each room routine |
| `max` | 6 | Carrying limit |
| `mob` | 35 | Highest real object number; nouns 36–41 are directions |
| `m` | 99 | "carried" marker in the object array |

Magic constants: verb 200 / noun 201 mean "word not in vocabulary".

### Dispatch

| Situation | Jump |
|---|---|
| A command | `GO TO 1000 + verb*100` (verb 0 = a bare direction) |
| `TAKE` a scenery noun (>35) | `GO TO 8000 + 10*room` |
| `EXAMINE` a scenery noun (>35) | `GO TO 8400 + 10*room` |
| Room description | `GO SUB 7000 + 10*room` |
| Nothing matched | line 8309 — one of messages 13/14/15 at random |

Sinclair BASIC falls through to the *next higher* line number when the target
doesn't exist, which is how rooms 24–27 all land on the generic garden text at
line 7280, and how verb 37 (`PULL`) shares line 4800 with `PUSH`.

---

## 2. Map

Exit table at 62529: 31 rows of 7 bytes — `room, N, S, E, W, UP, DOWN` (0 = no exit).

| # | Room | N | S | E | W | Up | Down |
|---|---|---|---|---|---|---|---|
| 1 | Egyptian Tomb (east end) | 2 | 3 | – | 4 | – | – |
| 2 | Burial chamber — male MUMMY | – | 1 | – | – | – | – |
| 3 | Burial chamber — female MUMMY | 1 | – | – | – | – | – |
| 4 | Long corridor, east end | 5 | 6 | 1 | 7 | – | – |
| 5 | Dusky alcove (bat, spider) | – | 4 | – | – | – | – |
| 6 | Five-sided room (Soothsayer) | 4 | – | – | – | – | – |
| 7 | Narrow corridor, towards east end | 8 | 10 | 4 | 11 | – | – |
| 8 | Temple (sacred cow) | 9 | 7 | – | – | – | – |
| 9 | The byre (haystack) | – | 8 | – | – | – | – |
| 10 | The SCARLET ROOM | 7 | – | – | – | – | – |
| 11 | Dark corridor, near west end | 12 | 14 | 7 | 15 | – | – |
| 12 | Plain burial chamber (MUMMY CASE) | – | 11 | – | – | – | – |
| 13 | Patio and ornamental pool | 24 | – | – | 19 | – | – |
| 14 | Above the snake-pit | 11 | – | – | – | – | – |
| 15 | Long corridor, west end | – | 17 | 11 | 20 | – | 16 |
| 16 | The room full of DOWN | – | – | – | – | 15 | – |
| 17 | The BLACK room | 15 | – | – | – | – | – |
| 18 | The Treasure Room | 19 | 20 | – | – | – | – |
| 19 | The Concubine's Apartments | – | 18 | 13 | – | – | – |
| 20 | Entrance hall (Anubis, silver doors) | 18 | 21 | 15 | – | – | – |
| 21 | Sandstone cave (the SPHINX) | 20 | 22 | – | – | – | – |
| 22 | The Funeral Parlour | 21 | – | 23 | – | – | – |
| 23 | The Ante-Chamber | – | – | – | 22 | – | – |
| 24 | Garden (maze) | 24 | 13 | 26 | 24 | – | – |
| 25 | Garden (maze) | 25 | 25 | 28 | 24 | – | – |
| 26 | Garden (maze) | 25 | 13 | 27 | 24 | – | – |
| 27 | Garden (maze) | 25 | 27 | 27 | 26 | – | – |
| 28 | Garden (mulberry / silkworms) | 28 | 27 | 28 | 28 | – | – |
| 29 | THOTH's high chamber | – | – | – | – | – | – |
| 30 | Inside the MUMMY CASE | – | – | – | – | – | – |
| 31 | The snake pit | – | – | – | – | – | – |

**Notes**

* Room 1 → West is refused until you have visited *both* alcoves
  (`f+8` and `f+9` must both be 1): *"Both N and S before W!"*
* Room 15 ↔ 16 is the only vertical link, and only via `CLIMB STAIRS` /
  `DESCEND STAIRS` (lines 4500/4600) — the UP/DOWN exits in the table back it up.
* Room 20 → West is the silver doors; the Anubis blocks it
  (*"The ANUBIS blocks your way."*). The only way through is `TICKLE ANUBIS`.
* Room 29 and 30 have no exits — you leave them by scripted events.
* **The garden (24–28) is the maze.** Only rooms 24 and 26 lead back out (S → 13).
  The route from the patio to the useful garden room 28 is `N, E, N, E`
  (13 → 24 → 26 → 25 → 28) — see §6.
* **Room 31 is unreachable.** Nothing in the program ever sets the room to 31; the
  snake-pit death text at line 7310 is dead code. The snake kills you through
  message 19 instead.

---

## 3. Room descriptions

Printed at 32 columns with a `*` border down each side. The inner 30 columns are
the text. Colours are per-room (`POKE bl,<ink>`).

**1 — Egyptian Tomb (east end)** *(ink 1, blue)*
```
* You are in an EGYPTIAN TOMB. *
* It is the burial place of    *
* some bygone ruler or GOD.    *
* There is a long dark corridor*
* stretching to the west as far*
* as the eye can see. You can  *
* see two dimly lit alcoves to *
* the north and south..........*
*      THERE IS NO WAY OUT     *
```

**2 — Burial chamber, male MUMMY** *(ink 3)*
```
* In this burial chamber there *
* is a male MUMMY--he is lying *
* on a marble slab, and he is  *
*      COMPLETELY NAKED        *
```
First visit only (sets `f+8`):
```
* He says, "Vandals desecrated *
* my tomb and left me like this*
* Could you please help me by  *
* replacing my lost garment    *
* and possessions "            *
```
Once he has been satisfied (`f+6` = 4):
```
*      This burial chamber     *
*         is now EMPTY         *
```

**3 — Burial chamber, female MUMMY** *(ink 7)*
```
* In this burial chamber there *
* is a female MUMMY--she is    *
* lying on a marble slab, and  *
* she is COMPLETELY NAKED!     *
```
First visit only (sets `f+9`):
```
* She says, "Vandals desecrated*
* my tomb and left me like this*
* Could you please help me by  *
* replacing my adornments."    *
```
Once satisfied (`f+7` = 4):
```
*      This burial chamber     *
*    is now COMPLETELY EMPTY   *
```

**4 — Long corridor, east end** *(ink 3)*
```
* This is the east end of a    *
* long corridor with flickering*
* lights from unseen torches.  *
```

**5 — Dusky alcove** *(ink 2)*
```
* You are in a dusky alcove. A *
* bat is hovering about and    *
* there is a spider busily     *
* spinning a web in a corner.  *
```
After the spider has been fed (`f+18` = 1), the last two lines become:
```
* there is a part finished web *
* in one corner.               *
```

**6 — Five-sided room** *(ink 1)*
```
* You enter a five-sided room. *
* There is a mysterious fire   *
* burning inside a pentacle of *
* stones. The signs of the     *
* Zodiac adorn the walls.      *
* There is a distinct air of   *
* magic about this place.      *
```
First visit only (`f+10`), full-width:
```
 As your eyes become accustomed
 to the fire light, you see a
 Soothsayer sitting at the far
 end of the room. He is swaying
 gently from side to side as he
 chants strange words and music.
```
Thereafter appended:
```
* There is a soothsayer sitting*
* at the far end of the room.  *
```

**7 — Narrow corridor, towards east end** *(ink 3)*
```
* You are part-way along a dark*
* narrow corridor, towards the *
* east end. It is quiet here!  *
```

**8 — Temple** *(ink 1)*
```
*  You have entered a TEMPLE.  *
```
Cow not yet fed (`f+11` = 0):
```
* A sacred cow is sitting on a *
* Persian carpet looking at    *
* you with brown lanquid eyes. *
```
Cow fed (`f+11` = 1):
```
* The sacred cow gazes at you  *
* as she happily chews the cud.*
```

**9 — The byre** *(ink 6)*
```
* You have entered the byre.   *
* This is obviously where the  *
* sacred cow sleeps. There is  *
* a scent of sweet hay in here *
```
Haystack intact (`f+12` = 0): `* coming from a small haystack *`
Haystack collapsed (`f+12` = 1): `* coming from a pile of hay.   *`

**10 — The SCARLET ROOM** *(ink 2)*
```
* This is the SCARLET ROOM It  *
* is completely painted in RED *
* On a plinth in the middle of *
* the room stands a carved box *
```

**11 — Dark corridor, near west end** *(ink 3)*
```
* You are part-way along a dark*
* corridor, near the west end. *
* The silence here is deafening*
```

**12 — Plain burial chamber** *(ink 1)*
```
* You are in a small, extremely*
* plain burial chamber. Lying  *
* on the floor is an apparently*
* forgotten MUMMY CASE.        *
```

**13 — Patio** *(ink 2)*
```
* You are on the patio outside *
* the Concubine's Apartments.  *
* Here there is an ornamental  *
* pool which is gleaming with  *
* a strange green glow. To the *
* north lies an exotic garden. *
```

**14 — Above the snake-pit** *(ink 4)*
```
* You are standing above the   *
* snake-pit. Below, snakes of  *
* all shapes and sizes writhe  *
* and intertwine. A winding,   *
* slimy ramp leads up from the *
* pit to your feet. Several    *
* snakes are slithering up it. *
```

**15 — Long corridor, west end** *(ink 3)*
```
*   This is the west end of    *
*    a long dark corridor.     *
*   A flight of stairs leads   *
*       down from here.        *
```

**16 — The room full of DOWN** *(ink 7)*
```
*   You have come down, down,  *
*   down, into a room full of  *
*           DOWN!              *
```

**17 — The BLACK room** *(ink 1)*
```
* You are now in the BLACK room*
* where the walls are hung with*
* black velvet, and magical    *
* symbols have been etched out *
* in gold on the ceiling. The  *
* whole room is illuminated    *
* with an EERIE, EERIE GLOW.   *
```

**18 — The Treasure Room** *(ink 2)*
```
* This is the Treasure Room. In*
* glass cases there is on show *
* the most wonderful jewellery.*
* One case is open and seems   *
* to be empty--it does look as *
* though it was the work of    *
* vandals. Also, there is a    *
* skeleton lying on the floor. *
```

**19 — The Concubine's Apartments** *(ink 5)*
```
* You are in the Concubine's   *
* Apartments. The decorations  *
* consist of rich hangings in  *
* peacock blue and acid yellow.*
* A faint smell of perfume is  *
* in the air. There is a patio *
* to the east.                 *
```
Appended when the Concubine is present (`f+14` < 2 **and** `RND` < 0.5 — she is
re-rolled on every entry, and `f+15` records whether she is here):
```
* A beautiful Egyptian         *
* Concubine is sitting at her  *
* dressing table.              *
```

**20 — Entrance hall** *(ink 1)*
```
* A tall anubis stands in the  *
* entrance hall in front of a  *
* pair of closed, silver doors.*
```

**21 — Sandstone cave** *(ink 3)*
```
* This is much more like a     *
* cave than a room. The most   *
* prominent feature here is a  *
* SPHINX, carved from sandstone*
```
Fly still alive (`f+25` = 0):
```
* with what looks like a FLY   *
* on his nose!                 *
```

**22 — The Funeral Parlour** *(ink 1)*
```
* This is the very depressing  *
* Funeral Parlour. The faint   *
* strains of solemn music can  *
* be heard in here.            *
```

**23 — The Ante-Chamber** *(ink 2)*
```
* This appears to be an Ante-  *
* Chamber attached to the      *
* Funeral Parlour. It has the  *
* uncared-for appearance of    *
* not having been used for a   *
* very long time.              *
```

**24–28 — The garden** *(ink 4 border; body ink = room − 21, so each maze room is
a different colour: 3, 4, 5, 6, 7)*
```
    You are in the exotic
     ornamental garden.
```

**29 — THOTH's high chamber** *(ink 6)*
```
* You are in a high chamber,   *
* decorated with beautiful     *
* paintings of Egyptian figures*
* At the far end of the room,  *
* on a large golden Throne sits*
* THOTH THE EGYPTIAN SUN GOD.  *
```

**30 — Inside the MUMMY CASE** *(ink 7)*
```
* You are now inside the MUMMY *
* CASE with the MUMMY! It is   *
* quite dim in here but you    *
* can just see a CATCH with a  *
* gold slot in it. You can also*
* feel the MUMMY'S breath on   *
* your cheek!                  *
```

**31 — The snake pit** *(unreachable)*
```
* You're in the SNAKE PIT with *
* these poisonous snakes.....  *
```

---

## 4. Objects

Description table at 60852 (each entry is one 32-column line, `FF`-separated).
The listing routine prints them under a `* Here you can see: *` banner.

| # | Description | Starts at | How you get it |
|---|---|---|---|
| 1 | A wicker BASKET | room 15 | lying there |
| 2 | Cleopatra's NEEDLE | — | falls out of the haystack (room 9) |
| 3 | CLOTH of gold | — | left behind by the male mummy (room 2) |
| 4 | A bronze-coloured TOKEN | room 30 | inside the mummy case |
| 5 | A JUG of embalming fluid | — | `FILL JUG` at the pool (room 13) |
| 6 | A quantity of BANDAGES | — | `CUT SHROUD` with the scissors |
| 7 | Some funeral FOOD | room 22 | lying there |
| 8 | A snake-shaped CHARM | — | drops when you catch the snake (room 14) |
| 9 | A BRACELET of red gold | — | inside the carved box (room 10) |
| 10 | An ornate NECKLACE | — | `SEARCH CASE` in the Treasure Room (room 18) |
| 11 | Some exotic PERFUME | — | Concubine's reward for the RUBY |
| 12 | Some adorning KOHL | — | Concubine's reward for the COIN |
| 13 | A short golden ROD | **carried** | you start with it |
| 14 | A pair of gold SCISSORS | — | THOTH's gift on your first audience |
| 15 | A dead, dead FLY | — | `TELL JOKE` to the Sphinx (room 21) |
| 16 | An old scroll of RUNES | room 17 | lying in the BLACK room |
| 17 | A small golden KEY | — | Soothsayer's reward for the RUNES |
| 18 | A handful of HAY | — | `TAKE HAY` in the byre (once only) |
| 19 | A shiny, gold COIN | — | revealed when the cow stands up (room 8) |
| 20 | A piece of FLUFF | — | `EXAMINE DOWN` in room 16 |
| 21 | A musical PIPE | room 23 | lying in the Ante-Chamber |
| 22 | An old white SHROUD | room 30 | inside the mummy case |
| 23 | A gorgeous RAIMENT | — | `SEW CLOTH` with the threaded needle |
| 24 | A rather funny JOKE | — | the female mummy tells it to you |
| 25 | Some very fine THREAD | — | `EXAMINE SILKWORMS` in garden room 28 |
| 26 | A nasty-looking SNAKE | — | `PLAY PIPE` at the snake-pit |
| 27 | A navel-shaped RUBY | — | `EXAMINE FLUFF` |
| 28–30 | *(unused: "no28", "no29", "no30")* | — | placeholders |
| 31 | A BASKET with a snake in it | — | replaces 1 + 26 when you catch the snake |
| 32 | A threaded NEEDLE | — | `THREAD NEEDLE` (needs 2 + 25) |
| 33 | Shaped pieces of gold CLOTH | — | `CUT CLOTH` with the scissors |
| 34 | A gold TOKEN | — | `RUB TOKEN` / `WAVE ROD` inside the case |
| 35 | A silver JUG | — | revealed when the spider leaves (room 5) |

Objects 28–30 are dead slots — the vocabulary still carries `*NO28`, `NO29`, `NO30`
as nouns 28–30, so they parse but nothing responds to them.

### Initial placement (init routine at 65058)

Everything is zeroed, current room is set to 1, then:

| Object | Location |
|---|---|
| 1 BASKET | room 15 |
| 4 bronze TOKEN | room 30 |
| 7 FOOD | room 22 |
| 13 ROD | **carried (99)** |
| 16 RUNES | room 17 |
| 21 PIPE | room 23 |
| 22 SHROUD | room 30 |

All other objects start at 0 (nowhere) and are created by events.
`f+5` and the carry counter are both set to 1 by BASIC line 9985.

---

## 5. Vocabulary

Both tables are fixed 6-byte records: 5 characters (space-padded) plus a code
byte. **The parser matches on the first 5 letters** — the Adventure Guide says so
explicitly, and the table format confirms it.

### Verbs (table at 63680) — `GO TO 1000 + code*100`

| Code | Words | Handler |
|---|---|---|
| 0 | *(a bare direction)* | 1000 |
| 1 | TAKE | 1100 |
| 2 | DROP | 1200 |
| 3 | EXAMI(NE) | 1300 |
| 4 | LOOK, L, R | 1400 |
| 5 | INVEN(TORY), I, LIST | 1500 |
| 6 | QUIT, STOP | 1600 → 1602 |
| 7 | SAVE | 1700 |
| 8 | LOAD | 1800 |
| 9 | HELP | 1900 |
| 10 | SEARC(H) | 2000 |
| 11 | OPEN | 2100 |
| 12 | CUT | 2200 |
| 13 | GIVE, OFFER | 2300 |
| 14 | SEW | 2400 |
| 15 | THREA(D) | 2500 |
| 16 | TOUCH | 2600 |
| 17 | DRINK | 2700 |
| 18 | FILL | 2800 |
| 19 | EAT | 2900 |
| 20 | MAKE | 3000 |
| 21 | WEAR | 3100 |
| 22 | SMELL, SNIFF | 3200 |
| 23 | READ | 3300 |
| 24 | UNLOC(K) | 3400 |
| 25 | PLAY | 3500 |
| 26 | BLOW | 3600 |
| 27 | TELL | 3700 |
| 28 | KILL | 3800 |
| 29 | CATCH | 3900 |
| 30 | MILK | 4000 |
| 31 | MOVE | 4100 |
| 32 | JUMP | 4200 |
| 33 | DIVE | 4300 |
| 34 | SWIM | 4400 |
| 35 | CLIMB | 4500 |
| 36 | DESCE(ND) | 4600 |
| 37 | PULL | 4700 → 4800 |
| 38 | PUSH | 4800 |
| 39 | KISS | 4900 |
| 40 | FEEL | 5000 |
| 41 | INSER(T) | 5100 |
| 42 | USE | 5200 |
| 43 | TICKL(E) | 5300 |
| 44 | FEED | 5400 |
| 45 | LIFT | 5500 |
| 46 | WAIT, REST | 5600 |
| 47 | BREAK, SMASH | 5700 |
| 48 | LISTE(N) | 5800 |
| 49 | SAY | 5900 |
| 50 | RUB | 6000 |
| 51 | WAVE | 6100 |

Verb 49 (`SAY`) is special-cased at line 206: it is allowed through even when the
noun isn't in the vocabulary.

### Nouns (table at 62751)

**Objects, 1–35** — the same numbering as the object table above. `BASKE`,
`NEEDL`, `CLOTH`, `TOKEN`, `JUG` are each listed twice so that both the plain and
the transformed version of the object answer to the same word. `GARME(NT)` and
`CLOAK` are extra synonyms for 23 (RAIMENT); `SCROL(L)` is a synonym for 16 (RUNES).

**Directions, 36–41**

| Code | Words |
|---|---|
| 36 | NORTH, N |
| 37 | SOUTH, S |
| 38 | EAST, E |
| 39 | WEST, W |
| 40 | UP, U |
| 41 | DOWN, D |

Movement subtracts `mob` (35) to get 1–6 and indexes the exit row.

**Scenery, 43–113**

| Code | Words | | Code | Words |
|---|---|---|---|---|
| 43 | CORRI(DOR) | | 79 | IN |
| 44 | ALCOV(E) | | 80 | VELVE(T) |
| 45 | MUMMY | | 81 | SYMBO(LS) |
| 46 | MALE | | 82 | GOLD |
| 47 | FEMAL(E) | | 83 | CEILI(NG) |
| 48 | SLAB | | 84 | JEWEL(LERY) |
| 49 | TOMB | | 85 | SKELE(TON) |
| 50 | CHAMB(ER) | | 86 | HANGI(NGS) |
| 51 | MARBL(E) | | 87 | CONCU(BINE) |
| 52 | BAT | | 88 | APART(MENTS) |
| 53 | SPIDE(R) | | 89 | TABLE, DRESS(ING TABLE) |
| 54 | WEB | | 90 | ANUBI(S) |
| 55 | CORNE(R) | | 91 | HALL |
| 56 | PENTA(CLE), STONE(S) | | 92 | DOORS, DOOR |
| 57 | SOOTH(SAYER) | | 93 | SPHIN(X) |
| 58 | ROOM | | 94 | CAVE |
| 59 | FIRE | | 95 | PARLO(UR) |
| 60 | SIGNS | | 96 | MULBE(RRY) |
| 61 | WALLS, WALL | | 97 | LEAVE(S) |
| 62 | COW | | 98 | SILKW(ORMS), WORMS |
| 63 | CARPE(T) | | 100 | CATCH |
| 64 | TEMPL(E) | | 101 | FLOWE(RS) |
| 65 | HAYST(ACK) | | 102 | PLANT(S) |
| 66 | PILE | | 103 | SLOT |
| 67 | BYRE | | 104 | EYES |
| 68 | PLINT(H) | | 105 | TREAS(URE) |
| 69 | BOX | | 106 | ABRAC(ADABRA) |
| 70 | CASE | | 107 | GLASS |
| 71 | CASES | | 108 | NOSE |
| 72 | PATIO | | 109 | ETCHI(NGS) |
| 73 | POOL | | 110 | LIQUI(D), FLUID |
| 74 | GARDE(N) | | 111 | HELLO |
| 75 | GLOW | | 112 | ERNIE |
| 76 | PIT | | 113 | BUSH |
| 77 | RAMP | | | |
| 78 | STAIR(S) | | | |

**Single-word commands, 178–190.** When only one word is typed it is looked up in
*both* tables, so e.g. `JUMP` yields verb 32 **and** noun 184.

| Code | Words |
|---|---|
| 178 | LISTE(N) |
| 179 | WAIT, REST |
| 180 | SWIM |
| 181 | DIVE |
| 182 | DESCE(ND) |
| 183 | CLIMB |
| 184 | JUMP |
| 185 | HELP |
| 186 | LOAD |
| 187 | SAVE |
| 188 | QUIT, STOP |
| 189 | LIST, I, INVEN(TORY) |
| 190 | LOOK, L, R |

---

## 6. The puzzles

### Flags (`PEEK (f+n)`)

| n | Meaning |
|---|---|
| 0 | current room |
| 1 | snake is in the basket |
| 2 | needle has been threaded |
| 3 | cloth has been cut |
| 4 | token has been turned to gold |
| 5 | pool not yet drawn from (starts at 1, cleared by `FILL JUG`) |
| 6 | male mummy: 0 = waiting, 4 = satisfied and gone |
| 7 | female mummy: 0 = waiting, 4 = satisfied and gone |
| 8 | you have visited the north alcove |
| 9 | you have visited the south alcove |
| 10 | you have met the Soothsayer |
| 11 | cow has been fed |
| 12 | haystack has collapsed |
| 13 | THOTH audience counter (0/1/2 — the third is fatal) |
| 14 | number of gifts given to the Concubine (she stops appearing at 2) |
| 15 | Concubine is present right now |
| 16 | you have taken your handful of hay |
| 17 | a snake has come up the ramp |
| 18 | the spider has gone |
| 19 | Soothsayer has given you the key and the hint |
| 21 | the mummy case has been opened |
| 22 | navel fluff has been found in room 16 |
| 23 | empty glass case has been searched |
| 24 | skeleton has done its song |
| 25 | the fly is dead |
| 26 | silkworms have been found |
| 27 | mulberry bush has been found |
| 28 | fluff has been examined (ruby released) |
| 29 | the RAIMENT has been made |
| 30 | magic symbols have been read (0/1/2) |
| 31 | you have eaten the funeral food |
| 99 | number of objects carried (limit 6) |

### The two mummies

The male mummy wants **JUG of embalming fluid (5), BANDAGES (6), FOOD (7),
CHARM (8)** — all four carried at once, in room 2. He takes them, thanks you and
runs off, dropping the **CLOTH of gold** on his way out.

The female mummy wants **BRACELET (9), NECKLACE (10), PERFUME (11), KOHL (12)** —
all four carried at once, in room 3. She thanks you and tells you a
**JOKE**, which becomes object 24 in your inventory.

You cannot pre-empt either of them: `GIVE` in their rooms is refused
(*"Don't GIVE me anything! When you have ALL that I require I'll reward you
well."*), and `DROP` is refused too while the mummy is still there — line 1204
answers *"That is not allowed in my presence!"* So you must arrive with all four
items already in hand.

### Chain of dependencies

```
ROD (start)
  └─ OPEN CASE (12) ──► room 30, contains bronze TOKEN + SHROUD
        ├─ RUB TOKEN / WAVE ROD ──► gold TOKEN
        │     └─ INSERT TOKEN ──► case opens, you land in room 11
        └─ SHROUD ──┐
PIPE (23)           │
  └─ PLAY PIPE (14) ──► snake climbs the ramp
        └─ CATCH SNAKE  (needs BASKET from room 15, else death)
              └─ CHARM ────────────────────────┐
RUNES (17)                                     │
  └─ GIVE RUNES to Soothsayer (6) ──► KEY + "TICKLE ANUBIS"
        ├─ UNLOCK BOX (10) ──► BRACELET (you drop the KEY)
        └─ TICKLE ANUBIS (20) ──► room 29, THOTH
              └─ THOTH gives SCISSORS ─┐
                                       ├─ CUT SHROUD ──► BANDAGES ──┐
                                       └─ CUT CLOTH ──► shaped CLOTH│
EXAMINE DOWN (16) ──► FLUFF                                         │
  └─ EXAMINE FLUFF ──► RUBY                                         │
        └─ GIVE RUBY to Concubine (19) ──► PERFUME                  │
TAKE HAY (9) ──► HAY + NEEDLE falls out                             │
  └─ FEED COW (8) ──► COIN                                          │
        └─ GIVE COIN to Concubine ──► KOHL                          │
SEARCH CASE (18) ──► NECKLACE                                       │
FILL JUG (13, needs silver JUG) ──► JUG of embalming fluid ─────────┤
  └─ silver JUG from GIVE FLY to spider (5)                         │
        └─ FLY from TELL JOKE to Sphinx (21)                        │
              └─ JOKE from the female mummy                         │
FOOD (22) ─────────────────────────────────────────────────────────┘
                                                    │
  male mummy (2) ◄── JUG + BANDAGES + FOOD + CHARM ─┘
        └─ CLOTH of gold
              └─ CUT CLOTH ──► shaped pieces
EXAMINE SILKWORMS (garden 28) ──► THREAD
  + NEEDLE ──► THREAD NEEDLE ──► threaded NEEDLE
        └─ SEW CLOTH ──► RAIMENT
              └─ take it to THOTH ──► THE END
```

Note the circularity the design leans on: you need the **JOKE** (female mummy) to
get the **FLY** → **silver JUG** → **embalming fluid**, which is one of the four
things the **male** mummy wants. But the female mummy's four items include the
**NECKLACE** and **BRACELET**, which are gated behind the Soothsayer's KEY and the
Treasure Room. So the female mummy must be completed first.

### Puzzle-by-puzzle

**Room 1 — the gate.** `W` is refused until both `f+8` and `f+9` are set, i.e.
until you have gone north *and* south from room 1.
> *"Both N and S before W!"*

**Room 9 — the haystack.** `TAKE HAY` while the haystack is intact gives you the
hay *and* knocks a needle out:
> *"OK. You take a handful of HAY / and the haystack collapses with / something falling at your feet"*
>
> `EXAMINE HAYSTACK` does the same thing without the hay:
> *"You disturb the haystack and a / needle falls out as the haystack / collapses into an untidy pile."*

Only one handful is allowed — a second attempt gives *"You've had your rations!"*

**Room 8 — the cow.** `FEED COW` (or `GIVE HAY`) while carrying the hay:
> *"The cow rises to eat the HAY and / you see a COIN on the carpet."*

`GIVE FOOD` to the cow redirects to the milk gag; `MILK COW` gives
*"Try an udder idea!"*

**Room 6 — the Soothsayer.** `GIVE RUNES`:
> *"The soothsayer is overwhelmed by / your generosity and gives you a / KEY, chuckles and splutters / "TICKLE ANUBIS-he hates it!""*

This sets `f+19`, which is the *only* thing that makes `TICKLE ANUBIS` work.
Giving him anything else: *"Your advances are rebuffed!"* / message 14.

Hint on `EXAMINE SOOTHSAYER`:
> *"He is a very strange figure, but / he could be of some assistance / given some sure news.........."*
> — i.e. *"sure n[ews]"* = RUNES.

**Room 10 — the carved box.** `UNLOCK BOX` with the KEY carried:
> *"The BOX unlocks. Inside you see / a BRACELET. As you hastily scoop / it up you drop the KEY."*

Without it: *"You have no KEY!"* The key is then lying in room 10 if you need it
again (you don't).

**Room 12/30 — the mummy case.** `OPEN CASE`:
> messages 20 and 21 — *"There is a MUMMY inside it! He pulls you in with him! AND TIGHTLY CLOSES THE CASE!"*

You are now in room 30 with the bronze TOKEN and the SHROUD, and a **CATCH with a
gold slot**. `FEEL CATCH` → *"You feel the outline of a slot!"*;
`EXAMINE CATCH` → *"There's a gold slot in it! Ah, / there's the RUB!"* — the hint
for `RUB`.

`RUB TOKEN` (or `WAVE ROD`), with the ROD in hand:
> *"There is a flash of GOLD as / the bronze TOKEN vibrates!"*

Without the rod: *"You're just making a ROD for / your own back!"*

`INSERT TOKEN` with the **gold** token:
> *"WELL DONE! The case opens and you fall out ... to find you are WHERE?"*

and you are dumped in room 11. Inserting the bronze one gives
*"Bronze is NOT good enough!"*

**Room 16 — the room full of DOWN.** `EXAMINE DOWN`:
> *"You find some navel FLUFF!"*

Then `EXAMINE FLUFF` (anywhere):
> *"A navel-shaped RUBY falls out!"*

`EXAMINE DOWN` again: *"Down! It's just DOWN! Try UP now"*. `EXAMINE UP`:
*"What a strange request! You must / have been put UP to it!"*

**Room 21 — the Sphinx.** The fly on its nose can't be taken
(*"As you reach out it flits about / but returns to the nose position"*).
`TELL JOKE` once you have the JOKE:
> *"The SPHINX smiles an inscrutable / smile but the joke KILLS the fly"*

and the dead FLY (object 15) drops in room 21. Telling it again:
*""I've heard that one" says / says the SPHINX."*; without the joke:
*"You try your best stories but / you can't raise a smile."*

**Room 5 — the spider.** `GIVE FLY`:
> *"The spider takes the fly, and / beetles off to enjoy the treat! / When he has gone you notice a / JUG in a dark corner."*

The silver JUG (35) appears in room 5. Incidental jokes: the bat is
*"BATTY BAT from GREEN DOOR, an adventure on SIX-in-ONE"*, and the spider
*"answers to Ernie!"* — hence the noun `ERNIE` (112), which gives
*""That's me!" says the spider!*.

**Room 13 — the pool.** The green glow is embalming fluid. `EXAMINE POOL`:
> *"On reflection, it's probably to / your advantage to know that the / pool contains embalming flluid!"* *(sic)*

`FILL JUG` with the silver jug:
> *"OK. That could be useful as the / liquid is embalming fluid!"*

`DRINK`/`TOUCH LIQUID` is fatal (messages 23 + 24 — *mummified*). So is
`SWIM`/`DIVE`/`JUMP` in the pool:
> *"That pool is full of embalming fluid! You are now in no state to carry on with your quest."*

**Room 14 — the snake-pit.** `PLAY PIPE`:
> *"One of the snakes slithers up / the ramp to be at your feet!"*

`CATCH SNAKE` **without** the basket = message 19, death:
> *"As you reach out for it you are / bitten on the wrist! Byeeeeee!"*

With the basket:
> *"As you catch the snake in the / basket, you notice it had a / CHARM which drops at your feet."*

`EXAMINE PIPE` is the hint: *"Perhaps a good BLOW in the / right place may help."*
(`BLOW` redirects to the `PLAY` handler.)

**Room 18 — the Treasure Room.** `SEARCH CASE` / `EXAMINE CASE` (the empty one):
> messages 10 and 11 — *"You notice a NECKLACE which must have been missed by the vandals, so you pick it up." / "But you drop it!"*

The necklace ends up on the floor of room 18. The skeleton is a gag:
`EXAMINE SKELETON` → *"It jumps up to sing: DEM BONES / DEM BONES, DEM DRY BONES! / then lies down again EXHAUSTED!"*

**Room 19 — the Concubine.** She is only there on a coin-flip (`RND < 0.5`) each
time you enter, and only while `f+14 < 2`. Two gifts, two rewards:

* `GIVE COIN` → *"THAT coin gets you some KOHL / from the grateful Concubine!"*
* `GIVE RUBY` → *"The Concubine smiles at you and / rewards you with some PERFUME."*

After both she stops appearing. If she isn't there: *"But there's no-one here!"*

**Room 20 — the Anubis.** West is blocked. `TICKLE ANUBIS`, once the Soothsayer
has told you to:
> *"The ANUBIS rolls about on the floor and you are able to dodge through the silver doors!"*

→ room 29. Without the hint: *"The Anubis manages to avoid you!"*

**Room 29 — THOTH.** First audience:
> *""Welcome to my tomb", says THOTH, "I suppose you'd like to go home! Well if you bring me a gift worthy of a GOD, I may let you escape. To show you that I am not completely heartless, here is a pair of golden SCISSORS which you may find useful. NOW GO! This audience is at an end.""*

You get the SCISSORS (object 14) and are moved to room 22. Second audience with
no gift: *""Now, where's my gift" shouts THOTH. "I'm getting rather impatient!
Do not return again without my gift or you may regret it!"* Third audience with
no gift **ends the game** — you are banished. So you have exactly three visits.

**The garden maze (24–28).** From the patio, `N` puts you in 24. The maze rooms
all look identical; the useful one is 28.

| From | N | S | E | W |
|---|---|---|---|---|
| 24 | 24 | **13 (out)** | 26 | 24 |
| 25 | 25 | 25 | 28 | 24 |
| 26 | 25 | **13 (out)** | 27 | 24 |
| 27 | 25 | 27 | 27 | 26 |
| 28 | 28 | 27 | 28 | 28 |

Room 25 is the only room with an east exit to 28. Route in: `13 N` → 24,
`E` → 26, `N` → 25, `E` → **28**. Route out: `S` → 27, `W` → 26, `S` → 13.

In room 28, `EXAMINE GARDEN`:
> *"There are plants, flowers and / bushes here. You notice that one / of the bushes is a MULBERRY bush"*

then `EXAMINE MULBERRY` (or BUSH):
> *"You see some silkworms eating / leaves and making very fine / THREAD.................(Think!)"*

which places the THREAD (object 25) in room 28. Asking about the silkworms too
early gives *"You're a bit previous!"*

**Making the gift.**

1. `CUT CLOTH` with the SCISSORS → *"OK. That seamed like a good idea"* (object 33).
2. `THREAD NEEDLE` with NEEDLE + THREAD → *"It wasn't easy! But it's done."* (object 32).
3. `SEW CLOTH` (or `MAKE RAIMENT`) → *"Well done! you have now made a raiment fit for a GOD."* (object 23).

Sewing without the threaded needle: *"Even you are not able to do that / without a threaded needle!"*;
cutting anything without scissors: *"Even you will need some SCISSORS / to be able to do that!"*

**The ending.** Return to room 29 carrying the RAIMENT:
> *"THOTH takes the GIFT and smiles!"* → *"Your head is spinning around"* →
> *"You find yourself on the floor in your own home!"* →
> *"You turn off the computer and go to bed"* → **HAPPY DREAMS**

### Deaths and losses

| Cause | Result |
|---|---|
| `CATCH SNAKE` without the basket | message 19 — bitten, game over |
| `DRINK`/`TOUCH` the pool liquid | messages 23 + 24 — mummified, game over |
| `SWIM`/`DIVE`/`JUMP` in the pool | *"in no state to carry on with your quest"*, game over |
| Third visit to THOTH with no gift | banished, game over |
| `EAT FOOD` | not fatal, but the funeral FOOD is gone and the male mummy can never be satisfied — the game is unwinnable |

`EAT FOOD` gives message 12 then *"Do you think that was wise?"* — it is the one
irrecoverable non-death mistake in the game.

### Red herrings and gags

* `SAY ABRACADABRA` in the BLACK room, after `EXAMINE SYMBOLS`, gives
  messages 12 and 17 and then *"But what prompted that?"* — nothing happens.
  The magic symbols are pure misdirection.
* `WEAR` any of the treasures: *"That's not for you!"*
* `HELP` → *"THOTH would like a GOLD garment!"* if you have met THOTH and not yet
  made the raiment, otherwise *"Not behind the RED DOOR"*.
* The title door itself never appears in the game — the RED DOOR is only in the
  intro sequence (*"In front of you there is a RED DOOR ... You opened it didn't
  you!"*).
* `LISTEN` responses vary by room: the Soothsayer's chanting (cheerful once he has
  the runes), *"Waken up! Faint solemn music."* in the Funeral Parlour,
  *"Munch, munch, munch!"* in the byre.
* Object 100 in the noun table is `CATCH` — the mummy-case catch, deliberately
  colliding with the verb `CATCH` (29). Which table you hit depends on word
  position.

---

## 7. Framing text

**Intro (BASIC lines 9900–9966).**
```
Press a key to start

In front of you there is a
       RED DOOR
   You opened it didn't you!

You enter what appears to be an EGYPTIAN tomb. Light comes from
flickering torches affixed to the walls. Ancient carvings
adorn a long....

      What's that noise?

You look up to see several large boulders just about to fall on you...

       You see RED!
    Then you BLACK out!

You open your eyes....Everything is blurred and your mind is fuzzy...
```
then a right-to-left scroller reveals: **" Can you now find your way home?"**

**Prompt.** Message 9, *"What to do now?"*

**Parser failure.** An unknown verb or noun prints *"Apologies from authors!"*
(BASIC line 45). A recognised command with no handler picks one of messages
13/14/15 at random: *"Try something else............"*, *"That won't do any good!"*,
*"Sorry! No can do!"*

**Game over.** *"Press a key to start again."*, then message 1
*"Do you want to try again? (Y/N)"*

**Publisher.** Tartan Software, 61 Bailie Norrie Crescent, Montrose, Angus,
Scotland DD10 9DT — this adventure was taken from their *6-in-1* compilation.
The loader also carries a generic seven-page "Adventure Guide" (see
`basic/RedDoor.bas`, lines 9000–9094), which notes that this adventure
**requires the first 5 letters** of each word.

---

## 8. Notes for a remake

* **Screen model.** Everything is written for 32×24 with a `*` frame. If you keep
  the frame, the text is already laid out for you; if you reflow it, the
  descriptions in §3 concatenate cleanly once you strip the border columns.
* **Two-word parser only.** Verb + noun, 5-letter truncation, no articles, no
  prepositions. `INSERT TOKEN` has no "in slot" — the room implies the target.
* **Carrying limit is 6** (`max`), enforced by the engine with message 5.
* **SAVE/LOAD** exist to tape *and* to a memory "bank" (a temporary in-RAM save);
  a remake would map both onto ordinary save slots.
* **Dead content to decide about:** room 31 (snake pit) is unreachable, objects
  28–30 are placeholders, and line 4700 (`PULL`) doesn't exist so `PULL` silently
  behaves as `PUSH`.
* **The `f+15` Concubine coin-flip** re-rolls on every entry to room 19, so a
  player can simply walk in and out until she appears. Worth deciding whether to
  keep that or make her deterministic.
