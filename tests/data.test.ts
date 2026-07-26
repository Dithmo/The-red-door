import { describe, expect, it } from "vitest";

import {
  DEAD_CONTENT,
  flagNames,
  lexicon,
  messages,
  objects,
  roomById,
  rooms,
  validate,
} from "../src/data/index";
import { CARRIED, NOWHERE } from "../src/data/types";

describe("generated game data", () => {
  it("is internally consistent", () => {
    expect(validate()).toEqual([]);
  });

  it("has the expected shape of the original", () => {
    expect(rooms).toHaveLength(31);
    // 35 objects, minus the three unused no28/no29/no30 placeholders
    expect(objects).toHaveLength(32);
    expect(lexicon.verbs).toHaveLength(51);
    expect(Object.keys(messages)).toHaveLength(29);
  });

  it("excludes the original's dead content", () => {
    const objectIds = new Set(objects.map((o) => o.id));
    for (const id of DEAD_CONTENT.objects) {
      expect(objectIds.has(id)).toBe(false);
    }
  });
});

describe("map", () => {
  it("reaches every room from the starting room", () => {
    // Rooms 29/30 are entered by scripted events, not by an exit, so they are
    // legitimately unreachable by walking. Everything else must be walkable --
    // including room 31, the snake pit, which is DOWN from room 14.
    const scripted = new Set([29, 30]);
    const seen = new Set<number>([1]);
    const queue = [1];
    while (queue.length) {
      const room = roomById.get(queue.shift()!)!;
      for (const target of Object.values(room.exits)) {
        if (target && !seen.has(target)) {
          seen.add(target);
          queue.push(target);
        }
      }
    }
    const unreachable = rooms
      .map((r) => r.id)
      .filter((id) => !seen.has(id) && !scripted.has(id));
    expect(unreachable).toEqual([]);
  });

  it("keeps the garden maze escapable", () => {
    // The maze is only fair if at least one garden room leads back out.
    const gardenIds = [24, 25, 26, 27, 28];
    const exitsOut = gardenIds.filter((id) => {
      const room = roomById.get(id)!;
      return Object.values(room.exits).some(
        (target) => target && !gardenIds.includes(target),
      );
    });
    expect(exitsOut).toEqual([24, 26]);
  });

  it("gives each garden room its own ink, the original's navigation cue", () => {
    const inks = [24, 25, 26, 27, 28].map((id) => roomById.get(id)!.ink);
    expect(inks).toEqual([3, 4, 5, 6, 7]);
    expect(new Set(inks).size).toBe(5);
  });
});

describe("fatal rooms", () => {
  it("marks the snake pit fatal and reachable by going down from room 14", () => {
    const pit = roomById.get(31);
    expect(pit, "room 31 must exist -- it is the snake-pit death").toBeDefined();
    expect(pit!.fatal?.text).toContain("asp time");
    expect(pit!.exits).toEqual({});
    expect(roomById.get(14)!.exits.down).toBe(31);
  });

  it("has exactly one fatal room", () => {
    // The other four deaths are triggered by rules, not by entering a room.
    expect(rooms.filter((r) => r.fatal).map((r) => r.id)).toEqual([31]);
  });
});

describe("objects", () => {
  it("starts the player holding only the ROD", () => {
    const carried = objects.filter((o) => o.startsAt === CARRIED);
    expect(carried.map((o) => o.key)).toEqual(["rod"]);
  });

  it("seeds exactly the original's six placed objects", () => {
    const placed = objects
      .filter((o) => o.startsAt !== NOWHERE && o.startsAt !== CARRIED)
      .map((o) => [o.key, o.startsAt] as const)
      .sort();
    expect(placed).toEqual([
      ["basket", 15],
      ["food", 22],
      ["pipe", 23],
      ["runes", 17],
      ["shroud", 30],
      ["token-bronze", 30],
    ]);
  });

  it("can distinguish every same-noun pair by adjective", () => {
    // The five transformation pairs are the reason the parser needs adjectives.
    const pairs: [string, string][] = [
      ["basket", "basket-with-snake"],
      ["needle", "needle-threaded"],
      ["cloth", "cloth-shaped"],
      ["token-bronze", "token-gold"],
      ["jug-full", "jug-silver"],
    ];
    for (const [a, b] of pairs) {
      const objA = objects.find((o) => o.key === a);
      const objB = objects.find((o) => o.key === b);
      expect(objA, `missing object ${a}`).toBeDefined();
      expect(objB, `missing object ${b}`).toBeDefined();
      expect(objA!.noun).toBe(objB!.noun);
      const overlap = objA!.adjectives.filter((adj) =>
        objB!.adjectives.includes(adj),
      );
      expect(overlap, `${a} and ${b} share adjectives`).toEqual([]);
    }
  });
});

describe("conditional room text", () => {
  it("references only known flags", () => {
    const known = new Set(Object.values(flagNames));
    for (const room of rooms) {
      const conds = [
        ...(room.descriptionVariants ?? []),
        ...(room.descriptionFragments ?? []),
        ...room.images.flatMap((i) => (i.when ? [{ when: i.when }] : [])),
      ];
      for (const cond of conds) {
        for (const c of cond.when) {
          if ("flag" in c) {
            expect(known, `unknown flag ${c.flag} in room ${room.id}`).toContain(
              c.flag,
            );
          }
        }
      }
    }
  });

  it("has no mid-word breaks from the 32-column layout", () => {
    // Fragments continue a partially-filled screen row; chunking them at column
    // 32 used to split words ("spider bus ily"). Guard against a regression.
    const suspicious = /\b(?:bus|ily|orner|nis|hed|cubine|ing)\b/;
    for (const room of rooms) {
      const texts = [
        room.description,
        ...(room.descriptionVariants ?? []).map((v) => v.text),
        ...(room.descriptionFragments ?? []).map((f) => f.text),
      ];
      for (const text of texts) {
        expect(text, `room ${room.id}: ${text}`).not.toMatch(suspicious);
      }
    }
  });

  it("keeps every transcription traceable to a BASIC line", () => {
    for (const room of rooms) {
      expect(room.origin).toMatch(/^red\.bas:\d+$/);
      for (const c of [
        ...(room.descriptionVariants ?? []),
        ...(room.descriptionFragments ?? []),
      ]) {
        expect(c.origin).toMatch(/^red\.bas:\d+$/);
      }
    }
  });
});

describe("lexicon", () => {
  it("maps every verb to a distinct original code", () => {
    const codes = lexicon.verbs.map((v) => v.originalCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(Math.min(...codes)).toBe(1);
    expect(Math.max(...codes)).toBe(51);
  });

  it("gives every verb at least one grammar pattern", () => {
    for (const verb of lexicon.verbs) {
      expect(verb.patterns.length, `verb ${verb.name}`).toBeGreaterThan(0);
      expect(verb.words, `verb ${verb.name}`).toContain(verb.name);
    }
  });

  it("keeps the original's 5-letter truncations parseable", () => {
    // e.g. the tape stores EXAMI, INVEN, UNLOC -- players who learned the
    // original must still be able to type them.
    const allWords = new Set(lexicon.verbs.flatMap((v) => v.words));
    for (const truncation of ["exami", "inven", "unloc", "tickl", "liste"]) {
      expect(allWords, `missing original form ${truncation}`).toContain(
        truncation,
      );
    }
  });

  it("resolves the CATCH verb/noun collision by keeping both", () => {
    // CATCH is verb 29 and scenery noun 100 in the original; grammar position
    // disambiguates. Both must survive the port.
    expect(lexicon.verbs.some((v) => v.words.includes("catch"))).toBe(true);
    expect(lexicon.scenery.some((s) => s.words.includes("catch"))).toBe(true);
  });
});
