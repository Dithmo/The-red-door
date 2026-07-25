#!/usr/bin/env python3
"""
Reverse-engineering extractor for RED-DOOR.TAP (ZX Spectrum, Tartan Software).

Reads the .TAP directly and emits every piece of game data:

  * the two BASIC programs, detokenised
  * the saved BASIC variables (all the single-letter constants)
  * the room exit table          (machine code, 62529)
  * the noun / verb vocabularies (machine code, 62751 / 63680)
  * the numbered message table   (machine code, 59560)
  * the object description table (machine code, 60852)
  * the initial object placement (init routine, 65058)
  * the room description text    (BASIC lines 7010-7310)

Usage:  python3 tools/extract_reddoor.py RED-DOOR.TAP [-o data/reddoor.json]
"""

import argparse
import json
import re
import sys

# --------------------------------------------------------------------------
# TAP container
# --------------------------------------------------------------------------

def read_tap(path):
    raw = open(path, "rb").read()
    blocks, i = [], 0
    while i < len(raw) - 1:
        ln = raw[i] | (raw[i + 1] << 8)
        i += 2
        blocks.append(raw[i:i + ln])
        i += ln
    return blocks


def headers(blocks):
    """Yield (index, type, name, length, param1, param2) for each 19-byte header."""
    for n, b in enumerate(blocks):
        if len(b) == 19 and b[0] == 0x00:
            yield (n, b[1], b[2:12].decode("latin1").rstrip(),
                   b[12] | (b[13] << 8), b[14] | (b[15] << 8), b[16] | (b[17] << 8))


# --------------------------------------------------------------------------
# Sinclair BASIC detokeniser
# --------------------------------------------------------------------------

TOKENS = {
    0xA3: "SPECTRUM ", 0xA4: "PLAY ", 0xA5: "RND", 0xA6: "INKEY$", 0xA7: "PI",
    0xA8: "FN ", 0xA9: "POINT ", 0xAA: "SCREEN$ ", 0xAB: "ATTR ", 0xAC: "AT ",
    0xAD: "TAB ", 0xAE: "VAL$ ", 0xAF: "CODE ", 0xB0: "VAL ", 0xB1: "LEN ",
    0xB2: "SIN ", 0xB3: "COS ", 0xB4: "TAN ", 0xB5: "ASN ", 0xB6: "ACS ",
    0xB7: "ATN ", 0xB8: "LN ", 0xB9: "EXP ", 0xBA: "INT ", 0xBB: "SQR ",
    0xBC: "SGN ", 0xBD: "ABS ", 0xBE: "PEEK ", 0xBF: "IN ", 0xC0: "USR ",
    0xC1: "STR$ ", 0xC2: "CHR$ ", 0xC3: "NOT ", 0xC4: "BIN ", 0xC5: " OR ",
    0xC6: " AND ", 0xC7: "<=", 0xC8: ">=", 0xC9: "<>", 0xCA: " LINE ",
    0xCB: " THEN ", 0xCC: " TO ", 0xCD: " STEP ", 0xCE: " DEF FN ", 0xCF: " CAT ",
    0xD0: " FORMAT ", 0xD1: " MOVE ", 0xD2: " ERASE ", 0xD3: " OPEN #",
    0xD4: " CLOSE #", 0xD5: " MERGE ", 0xD6: " VERIFY ", 0xD7: " BEEP ",
    0xD8: " CIRCLE ", 0xD9: " INK ", 0xDA: " PAPER ", 0xDB: " FLASH ",
    0xDC: " BRIGHT ", 0xDD: " INVERSE ", 0xDE: " OVER ", 0xDF: " OUT ",
    0xE0: " LPRINT ", 0xE1: " LLIST ", 0xE2: " STOP ", 0xE3: " READ ",
    0xE4: " DATA ", 0xE5: " RESTORE ", 0xE6: " NEW ", 0xE7: " BORDER ",
    0xE8: " CONTINUE ", 0xE9: " DIM ", 0xEA: " REM ", 0xEB: " FOR ",
    0xEC: " GO TO ", 0xED: " GO SUB ", 0xEE: " INPUT ", 0xEF: " LOAD ",
    0xF0: " LIST ", 0xF1: " LET ", 0xF2: " PAUSE ", 0xF3: " NEXT ",
    0xF4: " POKE ", 0xF5: " PRINT ", 0xF6: " PLOT ", 0xF7: " RUN ",
    0xF8: " SAVE ", 0xF9: " RANDOMIZE ", 0xFA: " IF ", 0xFB: " CLS ",
    0xFC: " DRAW ", 0xFD: " CLEAR ", 0xFE: " RETURN ", 0xFF: " COPY ",
}

COLOUR = {0x10: "INK", 0x11: "PAPER", 0x12: "FLASH", 0x13: "BRIGHT",
          0x14: "INVERSE", 0x15: "OVER"}


def split_lines(prog, prog_len):
    """Split a BASIC program image into {line_number: body_bytes}."""
    out, i = {}, 0
    while i < prog_len:
        num = (prog[i] << 8) | prog[i + 1]
        ln = prog[i + 2] | (prog[i + 3] << 8)
        out[num] = prog[i + 4:i + 4 + ln]
        i += 4 + ln
    return out


def detokenise(body):
    s, j = [], 0
    while j < len(body):
        b = body[j]
        if b == 0x0E:                      # hidden 5-byte numeric form
            j += 6
            continue
        if b in COLOUR:
            s.append("{%s %d}" % (COLOUR[b], body[j + 1]))
            j += 2
            continue
        if b in (0x16, 0x17):              # AT / TAB
            s.append("{%s %d,%d}" % ("AT" if b == 0x16 else "TAB",
                                     body[j + 1], body[j + 2]))
            j += 3
            continue
        if b == 0x0D:
            s.append("\n")
        elif b == 0x60:
            s.append("£")
        elif 32 <= b < 127:
            s.append(chr(b))
        elif b in TOKENS:
            s.append(TOKENS[b])
        else:
            s.append("{%02X}" % b)
        j += 1
    return "".join(s).rstrip("\n")


# --------------------------------------------------------------------------
# Saved BASIC variables
# --------------------------------------------------------------------------

def read_float(b):
    if b[0] == 0:                                   # small-integer form
        v = b[2] | (b[3] << 8)
        return v - 65536 if b[1] == 0xFF else v
    mant = ((b[1] | 0x80) << 24) | (b[2] << 16) | (b[3] << 8) | b[4]
    val = mant / 2.0 ** 32 * 2.0 ** (b[0] - 128)
    return -val if b[1] & 0x80 else val


def read_vars(v):
    """Return {name: value} for numeric variables in the saved variables area."""
    out, i = {}, 0
    while i < len(v) and v[i] != 0x80:
        b = v[i]
        kind = b >> 5
        if kind == 0b011:                           # single-letter number
            out[chr((b & 0x1F) + 96)] = read_float(v[i + 1:i + 6])
            i += 6
        elif kind == 0b101:                         # long-name number
            j = i + 1
            name = chr((b & 0x1F) + 96)
            while not v[j] & 0x80:
                name += chr(v[j] & 0x7F)
                j += 1
            name += chr(v[j] & 0x7F)
            j += 1
            out[name] = read_float(v[j:j + 5])
            i = j + 5
        elif kind == 0b010:                         # string
            i += 3 + (v[i + 1] | (v[i + 2] << 8))
        elif kind in (0b100, 0b110):                # arrays
            i += 3 + (v[i + 1] | (v[i + 2] << 8))
        elif kind == 0b111:                         # FOR control variable
            i += 19
        else:
            break
    return {k: int(x) if float(x).is_integer() else x for k, x in out.items()}


# --------------------------------------------------------------------------
# Machine-code data tables
# --------------------------------------------------------------------------

CODE_BASE = 58424          # headerless block loads at 58424..65535


class Code:
    def __init__(self, data):
        self.d = data

    def byte(self, addr):
        return self.d[addr - CODE_BASE]

    def span(self, a, b):
        return self.d[a - CODE_BASE:b - CODE_BASE]


def render_text(buf):
    """Turn a machine-code text run into plain text (control codes dropped)."""
    out, i = [], 0
    while i < len(buf):
        b = buf[i]
        if b == 0x0D:
            out.append("\n")
            i += 1
        elif b in COLOUR:
            i += 2
        elif b in (0x16, 0x17):
            i += 3
        elif b == 0x7F:                      # continuation / (c) glyph
            out.append("\n")
            i += 1
        elif 32 <= b < 127:
            out.append(chr(b))
            i += 1
        else:
            i += 1
    return "".join(out)


def split_table(code, base, end, separators):
    """Split a run of text on separator bytes; entry N follows the Nth separator."""
    out, n, cur = {}, 0, bytearray()
    for a in range(base, end):
        b = code.byte(a)
        if b in separators:
            if n:
                out[n] = render_text(cur).strip("\n")
            n += 1
            cur = bytearray()
        else:
            cur.append(b)
    if n:
        out[n] = render_text(cur).strip("\n")
    return {k: v for k, v in out.items() if v.strip()}


def read_vocab(code, start, end):
    """Vocabulary entries are 5 characters + 1 code byte."""
    out = []
    for a in range(start, end, 6):
        word = "".join(chr(c) for c in code.span(a, a + 5) if 32 <= c < 127)
        out.append({"word": word, "code": code.byte(a + 5), "addr": a})
    return out


def read_exits(code, base=62529, count=31):
    """Each row is 7 bytes: room, N, S, E, W, UP, DOWN."""
    rows = {}
    for i in range(count):
        r = code.span(base + i * 7, base + i * 7 + 7)
        rows[r[0]] = dict(zip(("north", "south", "east", "west", "up", "down"), r[1:]))
    return rows


def read_initial_objects(code, start=65079):
    """The init routine at 65058 is a run of  LD A,n : LD (HL),A : INC HL."""
    out, obj, a = {}, 1, start
    while code.byte(a) == 0x3E and code.byte(a + 2) == 0x77:
        out[obj] = code.byte(a + 1)
        obj += 1
        a += 3
        if code.byte(a) != 0x23:
            break
        a += 1
    return out


# --------------------------------------------------------------------------
# Room descriptions out of the BASIC
# --------------------------------------------------------------------------

def string_literals(body):
    """Extract every quoted string literal from a BASIC line body."""
    res, i = [], 0
    while i < len(body):
        if body[i] == 0x0E:
            i += 6
            continue
        if body[i] == 0x22:
            i += 1
            buf = bytearray()
            while i < len(body):
                if body[i] == 0x22:
                    if i + 1 < len(body) and body[i + 1] == 0x22:
                        buf.append(0x22)
                        i += 2
                        continue
                    break
                buf.append(body[i])
                i += 1
            i += 1
            res.append(bytes(buf))
            continue
        i += 1
    return res


def screen_rows(text, width=32):
    """The Spectrum wraps PRINT at 32 columns; recover the original rows."""
    return [text[k:k + width] for k in range(0, len(text), width)]


def room_text(lines, line_no):
    """Plain 32-column rows printed by one BASIC line, framed asterisks stripped."""
    rows = []
    for lit in string_literals(lines.get(line_no, b"")):
        plain = render_text(lit)
        if not plain.strip("* \n"):
            continue
        if plain.strip().isdigit():        # VAL "nnn" numeric literal, not text
            continue
        for row in screen_rows(plain):
            rows.append(row)
    return rows


# --------------------------------------------------------------------------

ROOM_LINES = {
    1: 7010, 2: 7021, 3: 7031, 4: 7040, 5: 7050, 6: 7060, 7: 7070, 8: 7080,
    9: 7090, 10: 7100, 11: 7110, 12: 7120, 13: 7130, 14: 7140, 15: 7150,
    16: 7160, 17: 7170, 18: 7180, 19: 7190, 20: 7200, 21: 7210, 22: 7220,
    23: 7230, 24: 7280, 25: 7280, 26: 7280, 27: 7280, 28: 7280, 29: 7290,
    30: 7300, 31: 7310,
}

ROOM_NAMES = {
    1: "Egyptian Tomb (east end)", 2: "Burial chamber - male MUMMY",
    3: "Burial chamber - female MUMMY", 4: "Long corridor, east end",
    5: "Dusky alcove (bat and spider)", 6: "Five-sided room (Soothsayer)",
    7: "Narrow corridor, towards east end", 8: "Temple (sacred cow)",
    9: "The byre (haystack)", 10: "The SCARLET ROOM (plinth and box)",
    11: "Dark corridor, near west end", 12: "Plain burial chamber (MUMMY CASE)",
    13: "Patio and ornamental pool", 14: "Above the snake-pit",
    15: "Long corridor, west end (stairs down)", 16: "The room full of DOWN",
    17: "The BLACK room", 18: "The Treasure Room",
    19: "The Concubine's Apartments", 20: "Entrance hall (Anubis, silver doors)",
    21: "Sandstone cave (the SPHINX)", 22: "The Funeral Parlour",
    23: "The Ante-Chamber", 24: "Ornamental garden (maze)",
    25: "Ornamental garden (maze)", 26: "Ornamental garden (maze)",
    27: "Ornamental garden (maze)", 28: "Ornamental garden (mulberry / silkworms)",
    29: "THOTH's high chamber", 30: "Inside the MUMMY CASE",
    31: "The snake pit (unreachable)",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tap", nargs="?", default="RED-DOOR.TAP")
    ap.add_argument("-o", "--out", default="data/reddoor.json")
    ap.add_argument("--basic-dir", default=None,
                    help="also write detokenised BASIC listings here")
    args = ap.parse_args()

    blocks = read_tap(args.tap)
    hdrs = list(headers(blocks))

    basic = {}
    for idx, typ, name, length, p1, p2 in hdrs:
        if typ == 0:                                   # BASIC program
            image = blocks[idx + 1][1:-1]
            basic[name] = (image, p2)                  # p2 = start of variables

    # the headerless block is the 7112-byte machine-code image at 58424
    code_block = max((b for b in blocks if len(b) > 19 and b[0] == 0xFF
                      and len(b) - 2 == 7112), key=len)
    code = Code(code_block[1:-1])

    game_image, var_start = basic["red"]
    lines = split_lines(game_image, var_start)
    constants = read_vars(game_image[var_start:])

    nouns = read_vocab(code, 62751, 63680)
    verbs = read_vocab(code, 63680, 64040)

    out = {
        "source": args.tap,
        "publisher": "Tartan Software, Montrose, Angus - from the 6-in-1 compilation",
        "memory_map": {
            "code_block_base": CODE_BASE,
            "flags_array": 64280,
            "object_locations": 64379,
            "verb_result": 64114,
            "noun_result": 64115,
            "exit_table": 62529,
            "noun_table": 62751,
            "verb_table": 63680,
            "message_table": 59560,
            "object_description_table": 60852,
            "init_routine": 65058,
            "carried_marker": 99,
            "unknown_verb_marker": 200,
            "unknown_noun_marker": 201,
            "direction_noun_base": 35,
        },
        "constants": constants,
        "rooms": [
            {
                "id": n,
                "name": ROOM_NAMES[n],
                "basic_line": ROOM_LINES[n],
                "text": room_text(lines, ROOM_LINES[n]),
                "exits": {k: v for k, v in read_exits(code).get(n, {}).items() if v},
            }
            for n in sorted(ROOM_NAMES)
        ],
        "objects": split_table(code, 60852, 62240, {0xFF}),
        "messages": split_table(code, 59560, 60700, {0xFC, 0xFD, 0xFE, 0xFF}),
        "nouns": [n for n in nouns if n["word"]],
        "verbs": [v for v in verbs if v["word"]],
        "initial_object_locations": read_initial_objects(code),
        "verb_dispatch": "GO TO 1000 + verb*100  (verb 0 = movement)",
        "scenery_dispatch": {
            "TAKE":    "GO TO 8000 + 10*room  (noun > 35)",
            "EXAMINE": "GO TO 8400 + 10*room  (noun > 35)",
        },
    }

    with open(args.out, "w") as fh:
        json.dump(out, fh, indent=2)
    print("wrote %s" % args.out, file=sys.stderr)

    if args.basic_dir:
        for name, (image, vs) in basic.items():
            path = "%s/%s.bas" % (args.basic_dir.rstrip("/"), name)
            with open(path, "w") as fh:
                for num in sorted(split_lines(image, vs)):
                    fh.write("%5d %s\n" % (num, detokenise(split_lines(image, vs)[num])))
            print("wrote %s" % path, file=sys.stderr)


if __name__ == "__main__":
    main()
