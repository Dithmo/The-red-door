#!/usr/bin/env python3
"""
Turn the raw reverse-engineering output into the remake's game data.

Reads   data/reddoor.json   (produced by tools/extract_reddoor.py)
        basic/red.bas       (for per-room ink colours and conditional text)
Writes  src/data/rooms.json
        src/data/objects.json
        src/data/messages.json
        src/data/lexicon.json

Everything that can be derived from the tape is derived. The only hand-authored
tables here are the ones the original encodes in control flow rather than data:
flag names, room slugs, object adjectives, and verb grammar patterns. Each is
marked CURATED and cross-referenced to docs/GAME-DATA.md.
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --------------------------------------------------------------------------
# CURATED: flag names.  Offsets are PEEK (f+n) -- see docs/GAME-DATA.md §6.
# --------------------------------------------------------------------------

FLAG_NAMES = {
    1: "snakeInBasket",      2: "needleThreaded",    3: "clothCut",
    4: "tokenIsGold",        5: "poolUndrawn",       6: "maleMummyDone",
    7: "femaleMummyDone",    8: "visitedNorthAlcove", 9: "visitedSouthAlcove",
    10: "metSoothsayer",     11: "cowFed",           12: "haystackCollapsed",
    13: "thothAudiences",    14: "concubineGifts",   15: "concubinePresent",
    16: "hayTaken",          17: "snakeOnRamp",      18: "spiderGone",
    19: "soothsayerHelped",  21: "caseOpened",       22: "fluffFound",
    23: "glassCaseSearched", 24: "skeletonSang",     25: "flyDead",
    26: "silkwormsFound",    27: "mulberryFound",    28: "fluffExamined",
    29: "raimentMade",       30: "symbolsRead",      31: "foodEaten",
}

# --------------------------------------------------------------------------
# CURATED: room slugs.
# --------------------------------------------------------------------------

ROOM_KEYS = {
    1: "tomb-east", 2: "chamber-male", 3: "chamber-female", 4: "corridor-east",
    5: "alcove", 6: "pentacle-room", 7: "corridor-narrow", 8: "temple",
    9: "byre", 10: "scarlet-room", 11: "corridor-west-inner",
    12: "chamber-plain", 13: "patio", 14: "snake-pit-edge",
    15: "corridor-west-end", 16: "room-of-down", 17: "black-room",
    18: "treasure-room", 19: "concubine-apartments", 20: "entrance-hall",
    21: "sphinx-cave", 22: "funeral-parlour", 23: "ante-chamber",
    24: "garden-a", 25: "garden-b", 26: "garden-c", 27: "garden-d",
    28: "garden-mulberry", 29: "thoth-chamber", 30: "inside-case",
    31: "snake-pit",
}

# Rooms 24-28 print their body in INK (room - 21); see docs/GAME-DATA.md §3.
GARDEN_INK = {r: r - 21 for r in range(24, 29)}

# --------------------------------------------------------------------------
# CURATED: rooms that kill you on arrival.  The room's own description routine
# ends in GO TO 1602 (game over) rather than returning.  The value is the BASIC
# line holding the death text.  See docs/GAME-DATA.md §2 and §6.
# --------------------------------------------------------------------------

FATAL_ROOMS = {31: 7311}   # DOWN from room 14 -- climbing into the snake-pit

# --------------------------------------------------------------------------
# CURATED: conditional room text.  Each entry names the BASIC line the text
# lives on, so the prose itself is still extracted rather than retyped.
#   kind "variant"  -> replaces the base description entirely (first match wins)
#   kind "fragment" -> appended to the description when the condition holds
# --------------------------------------------------------------------------

CONDITIONAL_TEXT = [
    (2,  "variant",  7020, [{"flag": "maleMummyDone",      "eq": 4}]),
    (3,  "variant",  7030, [{"flag": "femaleMummyDone",    "eq": 4}]),
    (5,  "fragment", 7051, [{"flag": "spiderGone",         "eq": 0}]),
    (5,  "fragment", 7052, [{"flag": "spiderGone",         "eq": 1}]),
    (6,  "fragment", 7062, [{"flag": "metSoothsayer",      "eq": 1}]),
    (8,  "fragment", 7081, [{"flag": "cowFed",             "eq": 0}]),
    (8,  "fragment", 7082, [{"flag": "cowFed",             "eq": 1}]),
    (9,  "fragment", 7091, [{"flag": "haystackCollapsed",  "eq": 0}]),
    (9,  "fragment", 7092, [{"flag": "haystackCollapsed",  "eq": 1}]),
    (19, "fragment", 7191, [{"flag": "concubinePresent",   "eq": 1}]),
    (21, "fragment", 7211, [{"flag": "flyDead",            "eq": 0}]),
]

# --------------------------------------------------------------------------
# CURATED: object adjectives.  The five pairs that differ only by adjective are
# the reason the parser needs adjective support at all (docs/GAME-DATA.md §5).
# --------------------------------------------------------------------------

OBJECT_ADJECTIVES = {
    1:  ["wicker", "empty"],
    31: ["snake", "full"],
    2:  ["plain", "bare", "cleopatras"],
    32: ["threaded"],
    3:  ["whole", "uncut"],
    33: ["shaped", "cut"],
    4:  ["bronze", "bronze-coloured"],
    34: ["gold", "golden"],
    5:  ["full", "embalming"],
    35: ["silver", "empty"],
    9:  ["red", "red-gold"],
    10: ["ornate"],
    13: ["short", "golden", "gold"],
    14: ["gold", "golden"],
    17: ["small", "gold", "golden"],
    19: ["shiny", "gold", "golden"],
    20: ["navel"],
    22: ["old", "white"],
    26: ["nasty", "nasty-looking"],
    27: ["navel", "navel-shaped"],
    8:  ["snake", "snake-shaped"],
}

# CURATED: object slugs where the bare noun is ambiguous.
OBJECT_KEYS = {
    1: "basket", 31: "basket-with-snake",
    2: "needle", 32: "needle-threaded",
    3: "cloth", 33: "cloth-shaped",
    4: "token-bronze", 34: "token-gold",
    5: "jug-full", 35: "jug-silver",
}

# --------------------------------------------------------------------------
# CURATED: verb grammar.  `patterns` uses N for a noun phrase; the preposition
# list is literal.  Verbs keep the original's terse form as well as the natural
# one, so both  UNLOCK BOX  and  UNLOCK BOX WITH KEY  parse.
# --------------------------------------------------------------------------

VERB_GRAMMAR = {
    "take":    {"patterns": ["V N", "V ALL", "V N from N"],
                "synonyms": ["get", "grab", "pick up", "collect", "pickup"]},
    "drop":    {"patterns": ["V N", "V ALL", "V ALL but N"],
                "synonyms": ["leave", "put down", "discard", "throw", "toss"]},
    "examine": {"patterns": ["V N"],
                "synonyms": ["x", "inspect", "study", "look at", "check",
                             "look"]},
    "look":    {"patterns": ["V", "V around"], "synonyms": ["l", "r", "redescribe"]},
    "inventory": {"patterns": ["V"], "synonyms": ["i", "inv", "list", "carrying"]},
    "quit":    {"patterns": ["V"], "synonyms": ["stop", "exit"]},
    "save":    {"patterns": ["V", "V N"], "synonyms": ["store"]},
    "load":    {"patterns": ["V", "V N"], "synonyms": ["restore", "recall"]},
    "help":    {"patterns": ["V"], "synonyms": ["hint", "clue", "?"]},
    "search":  {"patterns": ["V N"], "synonyms": ["look in", "look inside", "rummage"]},
    "open":    {"patterns": ["V N", "V N with N"], "synonyms": ["unseal"]},
    "cut":     {"patterns": ["V N", "V N with N"], "synonyms": ["slice", "snip", "trim"]},
    "give":    {"patterns": ["V N to N", "V N"], "synonyms": ["offer", "hand", "present"]},
    "sew":     {"patterns": ["V N", "V N with N"], "synonyms": ["stitch", "tailor"]},
    "thread":  {"patterns": ["V N", "V N with N"], "synonyms": []},
    "touch":   {"patterns": ["V N"], "synonyms": ["poke", "prod", "stroke"]},
    "drink":   {"patterns": ["V N", "V"], "synonyms": ["sip", "swallow", "taste"]},
    "fill":    {"patterns": ["V N", "V N from N", "V N with N"], "synonyms": []},
    "eat":     {"patterns": ["V N"], "synonyms": ["consume", "devour", "bite"]},
    "make":    {"patterns": ["V N", "V N from N"], "synonyms": ["create", "craft", "fashion"]},
    "wear":    {"patterns": ["V N"], "synonyms": ["put on", "don", "dress in"]},
    "smell":   {"patterns": ["V N", "V"], "synonyms": ["sniff"]},
    "read":    {"patterns": ["V N"], "synonyms": ["peruse"]},
    "unlock":  {"patterns": ["V N with N", "V N"], "synonyms": []},
    "play":    {"patterns": ["V N"], "synonyms": []},
    "blow":    {"patterns": ["V N"], "synonyms": []},
    "tell":    {"patterns": ["V N to N", "V N"], "synonyms": ["say to", "recount"]},
    "kill":    {"patterns": ["V N", "V N with N"], "synonyms": ["attack", "hit", "fight", "stab"]},
    "catch":   {"patterns": ["V N", "V N with N"], "synonyms": ["capture", "trap"]},
    "milk":    {"patterns": ["V N"], "synonyms": []},
    "move":    {"patterns": ["V N"], "synonyms": ["shift", "shove"]},
    "jump":    {"patterns": ["V", "V N", "V in N", "V into N"], "synonyms": ["leap"]},
    "dive":    {"patterns": ["V", "V in N", "V into N"], "synonyms": []},
    "swim":    {"patterns": ["V", "V in N"], "synonyms": []},
    "climb":   {"patterns": ["V N", "V up N", "V"], "synonyms": ["ascend", "go up"]},
    "descend": {"patterns": ["V N", "V down N", "V"], "synonyms": ["go down"]},
    "pull":    {"patterns": ["V N"], "synonyms": ["tug", "yank"]},
    "push":    {"patterns": ["V N"], "synonyms": ["press"]},
    "kiss":    {"patterns": ["V N"], "synonyms": ["hug", "embrace"]},
    "feel":    {"patterns": ["V N"], "synonyms": ["grope"]},
    "insert":  {"patterns": ["V N in N", "V N into N", "V N"],
                "synonyms": ["put in", "place in", "slot"]},
    "use":     {"patterns": ["V N", "V N on N"], "synonyms": []},
    "tickle":  {"patterns": ["V N"], "synonyms": []},
    "feed":    {"patterns": ["V N", "V N to N", "V N with N"], "synonyms": []},
    "lift":    {"patterns": ["V N"], "synonyms": ["raise", "heave"]},
    "wait":    {"patterns": ["V"], "synonyms": ["rest", "z", "pause"]},
    "break":   {"patterns": ["V N"], "synonyms": ["smash", "shatter"]},
    "listen":  {"patterns": ["V", "V to N"], "synonyms": []},
    "say":     {"patterns": ["V N", "V N to N"], "synonyms": ["shout", "speak", "utter"]},
    "rub":     {"patterns": ["V N", "V N with N"], "synonyms": ["polish", "buff"]},
    "wave":    {"patterns": ["V N", "V"], "synonyms": ["brandish", "shake"]},
    "go":      {"patterns": ["V N", "V to N"], "synonyms": ["walk", "head", "travel", "move to"]},
}

# The original's verb code -> our canonical verb name.
VERB_CODE_NAMES = {
    0: "go",   # movement: the original dispatches a bare direction as verb 0
    1: "take", 2: "drop", 3: "examine", 4: "look", 5: "inventory", 6: "quit",
    7: "save", 8: "load", 9: "help", 10: "search", 11: "open", 12: "cut",
    13: "give", 14: "sew", 15: "thread", 16: "touch", 17: "drink", 18: "fill",
    19: "eat", 20: "make", 21: "wear", 22: "smell", 23: "read", 24: "unlock",
    25: "play", 26: "blow", 27: "tell", 28: "kill", 29: "catch", 30: "milk",
    31: "move", 32: "jump", 33: "dive", 34: "swim", 35: "climb", 36: "descend",
    37: "pull", 38: "push", 39: "kiss", 40: "feel", 41: "insert", 42: "use",
    43: "tickle", 44: "feed", 45: "lift", 46: "wait", 47: "break", 48: "listen",
    49: "say", 50: "rub", 51: "wave",
}

# --------------------------------------------------------------------------
# CURATED: typo fixes applied to the remake's text only.
#
# The extraction under data/ stays faithful; these are corrections for the
# playable version. Byte 0x60 is POUND SIGN on the Spectrum, so message 20
# genuinely displayed "He pulls you in£with him!" in 1985 -- a mis-key for a
# space. Kept as a table of exact replacements so every change is auditable.
# --------------------------------------------------------------------------

TEXT_FIXES = [
    ("He pulls you in£with him!", "He pulls you in with him!"),
]

NOISE_WORDS = ["the", "a", "an", "my", "some", "of", "please", "at", "then"]
PREPOSITIONS = ["in", "into", "on", "onto", "with", "to", "from", "at",
                "under", "behind", "up", "down", "out", "off", "around",
                "but", "except"]

DIRECTIONS = {
    36: ("north", ["n"]), 37: ("south", ["s"]), 38: ("east", ["e"]),
    39: ("west", ["w"]), 40: ("up", ["u", "upward", "upwards"]),
    41: ("down", ["d", "downward", "downwards"]),
}


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def deframe(rows):
    """
    Recover prose from the original's 32-column framed layout.

    Every row is  '*' + 30 columns + '*', and the author hand-laid the text so no
    word straddles a row boundary -- so dropping the border asterisks and
    collapsing the padding runs is enough. Deliberately *not* re-chunking at 32
    columns: conditional fragments continue a partially-filled row (line 7051
    resumes at column 22), and chunking those splits words mid-way.
    """
    return tidy("".join(rows).replace("*", " "))


def tidy(text):
    """Collapse the runs of padding spaces the 32-column layout leaves behind."""
    return re.sub(r"\s+", " ", text).strip()


def load_basic_lines():
    lines = {}
    with open(os.path.join(ROOT, "basic", "red.bas")) as fh:
        for raw in fh:
            m = re.match(r"\s*(\d+) (.*)", raw.rstrip("\n"))
            if m:
                lines[int(m.group(1))] = m.group(2)
    return lines


def room_inks(basic):
    """Recover each room's ink colour from its  POKE bl,<var>  statement."""
    consts = None
    with open(os.path.join(ROOT, "data", "reddoor.json")) as fh:
        consts = json.load(fh)["constants"]
    inks = {}
    for line_no in sorted(basic):
        if not (7000 <= line_no < 7400):
            continue
        m = re.search(r"POKE bl,([a-z]+)", basic[line_no])
        if not m:
            continue
        room = line_no // 10 - 700
        ink = consts.get(m.group(1))
        if ink is not None and 0 <= ink <= 7:
            inks.setdefault(room, ink)
    return inks


def strings_from_basic_line(text):
    """Pull the quoted string literals out of a detokenised BASIC line."""
    out, i, n = [], 0, len(text)
    while i < n:
        if text[i] == '"':
            i += 1
            buf = []
            while i < n:
                if text[i] == '"':
                    if i + 1 < n and text[i + 1] == '"':
                        buf.append('"')
                        i += 2
                        continue
                    break
                buf.append(text[i])
                i += 1
            i += 1
            out.append("".join(buf))
            continue
        i += 1
    return out


CTRL = re.compile(r"\{(?:INK|PAPER|FLASH|BRIGHT|INVERSE|OVER|AT|TAB)[^}]*\}|\{[0-9A-F]{2}\}")


def basic_line_text(text):
    """The printable prose on one BASIC line, control codes removed."""
    parts = []
    for lit in strings_from_basic_line(text):
        clean = CTRL.sub("", lit)
        if not clean.strip("* \n") or clean.strip().isdigit():
            continue
        parts.append(clean)
    return deframe(parts)


CAPS = re.compile(r"\b([A-Z][A-Z'-]{2,})\b")


def object_noun(desc):
    """The original capitalises each object's key noun."""
    caps = CAPS.findall(desc)
    return caps[-1].lower().replace("'", "") if caps else None


def main():
    with open(os.path.join(ROOT, "data", "reddoor.json")) as fh:
        raw = json.load(fh)

    basic = load_basic_lines()
    inks = room_inks(basic)

    # ---------------- rooms ----------------
    conditional = {}
    for room, kind, line_no, when in CONDITIONAL_TEXT:
        text = basic_line_text(basic.get(line_no, ""))
        if not text:
            print("WARN: no text on BASIC line %d (room %d)" % (line_no, room),
                  file=sys.stderr)
            continue
        conditional.setdefault(room, []).append(
            {"kind": kind, "text": text, "when": when,
             "origin": "red.bas:%d" % line_no})

    rooms = []
    for r in raw["rooms"]:
        rid = r["id"]
        ink = GARDEN_INK.get(rid, inks.get(rid, 7))
        entry = {
            "id": rid,
            "key": ROOM_KEYS[rid],
            "name": r["name"],
            "ink": ink,
            "description": deframe(r["text"]),
            "exits": r["exits"],
            "images": [{"src": "%s.svg" % ROOM_KEYS[rid]}],
            "origin": "red.bas:%d" % r["basic_line"],
        }
        variants = [c for c in conditional.get(rid, []) if c["kind"] == "variant"]
        fragments = [c for c in conditional.get(rid, []) if c["kind"] == "fragment"]
        if variants:
            entry["descriptionVariants"] = [
                {"text": v["text"], "when": v["when"], "origin": v["origin"]}
                for v in variants]
        if fragments:
            entry["descriptionFragments"] = [
                {"text": f["text"], "when": f["when"], "origin": f["origin"]}
                for f in fragments]
        if rid in FATAL_ROOMS:
            line_no = FATAL_ROOMS[rid]
            entry["fatal"] = {
                "text": basic_line_text(basic.get(line_no, "")),
                "origin": "red.bas:%d" % line_no,
            }
        # every distinct visible state deserves its own picture
        for cond in variants + fragments:
            when = cond["when"]
            slug = "%s--%s%d" % (ROOM_KEYS[rid], when[0]["flag"], when[0]["eq"])
            entry["images"].insert(0, {"src": "%s.svg" % slug, "when": when})
        rooms.append(entry)

    # ---------------- objects ----------------
    nouns_by_code = {}
    for n in raw["nouns"]:
        nouns_by_code.setdefault(n["code"], []).append(n["word"].lower())

    objects = []
    for num_s, desc_raw in sorted(raw["objects"].items(), key=lambda kv: int(kv[0])):
        num = int(num_s)
        if num > 35 or num in (28, 29, 30):
            continue                      # banner row / unused placeholders
        desc = deframe([desc_raw])
        noun = object_noun(desc)
        if not noun:
            print("WARN: no noun found for object %d (%r)" % (num, desc),
                  file=sys.stderr)
            continue
        key = OBJECT_KEYS.get(num, noun)
        objects.append({
            "id": num,
            "key": key,
            "noun": noun,
            "adjectives": OBJECT_ADJECTIVES.get(num, []),
            "description": desc,
            "startsAt": raw["initial_object_locations"].get(num_s, 0),
        })

    # ---------------- lexicon ----------------
    verbs = []
    for code, name in sorted(VERB_CODE_NAMES.items()):
        g = VERB_GRAMMAR.get(name, {"patterns": ["V N"], "synonyms": []})
        originals = sorted({w["word"].lower() for w in raw["verbs"]
                            if w["code"] == code})
        verbs.append({
            "name": name,
            "originalCode": code,
            "patterns": g["patterns"],
            "words": sorted(set([name] + g["synonyms"] + originals)),
        })

    scenery = []
    for code, words in sorted(nouns_by_code.items()):
        if code <= 35 or code in DIRECTIONS or code >= 178:
            continue
        scenery.append({"code": code, "words": sorted(set(words))})

    lexicon = {
        "verbs": verbs,
        "directions": [{"name": name, "words": sorted(set([name] + extra +
                        [w for w in nouns_by_code.get(code, [])]))}
                       for code, (name, extra) in sorted(DIRECTIONS.items())],
        "scenery": scenery,
        "noiseWords": NOISE_WORDS,
        "prepositions": PREPOSITIONS,
        "pronouns": {"it": None, "them": None, "him": None, "her": None},
        "note": ("Original words are 5-letter truncations; the parser matches "
                 "exact, then >=3-char prefix, then fuzzy. See docs/GAME-DATA.md §5."),
    }

    # ---------------- messages ----------------
    def fix(text):
        for wrong, right in TEXT_FIXES:
            text = text.replace(wrong, right)
        return text

    messages = {k: fix(tidy(v.replace("\n", " "))) for k, v in raw["messages"].items()}

    out_dir = os.path.join(ROOT, "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    for name, payload in (("rooms", rooms), ("objects", objects),
                          ("lexicon", lexicon), ("messages", messages),
                          ("flags", FLAG_NAMES)):
        path = os.path.join(out_dir, "%s.json" % name)
        with open(path, "w") as fh:
            json.dump(payload, fh, indent=2)
            fh.write("\n")
        print("wrote src/data/%s.json" % name, file=sys.stderr)

    print("  %d rooms, %d objects, %d verbs, %d scenery nouns, %d messages"
          % (len(rooms), len(objects), len(verbs), len(scenery), len(messages)),
          file=sys.stderr)


if __name__ == "__main__":
    main()
