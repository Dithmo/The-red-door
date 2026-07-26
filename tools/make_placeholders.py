#!/usr/bin/env python3
"""
Generate placeholder artwork for every image slot in src/data/rooms.json.

Each placeholder is a small self-contained SVG tinted with that room's original
ZX Spectrum ink colour, so the game is fully playable and testable before any
real artwork exists. Real images drop in later by replacing the file -- nothing
in the code refers to the placeholders specifically.

Existing files are left alone unless --force is given, so hand-made art is never
clobbered by a rebuild.
"""

import argparse
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ZX Spectrum BRIGHT palette -- the tape runs with BRIGHT 1 throughout.
SPECTRUM = {
    0: "#000000", 1: "#0000ff", 2: "#ff0000", 3: "#ff00ff",
    4: "#00ff00", 5: "#00ffff", 6: "#ffff00", 7: "#ffffff",
}

W, H = 512, 384

def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def wrap(text, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > width:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    return lines


def text_el(x, y, size, colour, content, weight="normal", opacity=None):
    extra = ' font-weight="bold"' if weight == "bold" else ""
    if opacity is not None:
        extra += ' opacity="%s"' % opacity
    return ('  <text x="%d" y="%d" fill="%s" font-family="monospace" '
            'font-size="%d" text-anchor="middle"%s>%s</text>'
            % (x, y, colour, size, extra, esc(content)))


def render(title, state, ink):
    colour = SPECTRUM.get(ink, "#ffffff")
    cx = W // 2
    title_lines = wrap(title.upper(), 26)[:2]
    state_lines = wrap(state, 34)[:2] if state else []

    block = len(title_lines) * 32 + len(state_lines) * 22
    y = (H - block) // 2 + 24

    body = []
    for line in title_lines:
        body.append(text_el(cx, y, 26, colour, line, weight="bold"))
        y += 32
    y += 6
    for line in state_lines:
        body.append(text_el(cx, y, 17, colour, line, opacity="0.8"))
        y += 22
    body.append(text_el(cx, H - 34, 15, colour,
                        "placeholder · ink %d" % ink, opacity="0.55"))

    alt = esc(("%s %s" % (title, state)).strip())
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
        'viewBox="0 0 %d %d" role="img" aria-label="%s">\n'
        '  <defs>\n'
        '    <pattern id="scan" width="1" height="3" patternUnits="userSpaceOnUse">\n'
        '      <rect width="1" height="2" fill="#000"/>\n'
        '      <rect y="2" width="1" height="1" fill="%s" opacity="0.06"/>\n'
        '    </pattern>\n'
        '  </defs>\n'
        '  <rect width="%d" height="%d" fill="#000"/>\n'
        '  <rect width="%d" height="%d" fill="url(#scan)"/>\n'
        '  <rect x="12" y="12" width="%d" height="%d" fill="none" stroke="%s" '
        'stroke-width="3"/>\n'
        '%s\n'
        '</svg>\n'
        % (W, H, W, H, alt, colour, W, H, W, H, W - 24, H - 24, colour,
           "\n".join(body)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true",
                    help="overwrite existing files (destroys hand-made art)")
    args = ap.parse_args()

    with open(os.path.join(ROOT, "src", "data", "rooms.json")) as fh:
        rooms = json.load(fh)

    out_dir = os.path.join(ROOT, "assets", "images")
    os.makedirs(out_dir, exist_ok=True)

    written = skipped = 0
    for room in rooms:
        for slot in room["images"]:
            path = os.path.join(out_dir, slot["src"])
            if os.path.exists(path) and not args.force:
                skipped += 1
                continue
            state = ""
            if "when" in slot:
                c = slot["when"][0]
                state = "%s = %s" % (c["flag"], c["eq"])
            with open(path, "w") as fh:
                fh.write(render(room["name"], state, room["ink"]))
            written += 1

    print("placeholders: %d written, %d left alone" % (written, skipped))
    if skipped and not args.force:
        print("  (use --force to regenerate existing files)")


if __name__ == "__main__":
    main()
