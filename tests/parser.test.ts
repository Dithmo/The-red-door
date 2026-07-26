import { beforeEach, describe, expect, it } from "vitest";

import { CARRIED, NOWHERE } from "../src/data/types";
import { createWorld, type World } from "../src/engine/world";
import {
  createParserState,
  parse,
  type ParseOutcome,
  type ParserState,
} from "../src/parser/parser";
import { editDistance, tokenize } from "../src/parser/tokenize";
import { MIN_PREFIX } from "../src/parser/lexicon";

let world: World;
let state: ParserState;

beforeEach(() => {
  world = createWorld(1);
  state = createParserState();
});

function run(input: string): ParseOutcome {
  return parse(input, world, state);
}

/** The single command an input produced; fails loudly if it produced anything else. */
function one(input: string) {
  const outcome = run(input);
  if (outcome.kind !== "commands") {
    throw new Error(
      `expected a command for "${input}", got ${outcome.kind}: ` +
        ("message" in outcome ? outcome.message : ""),
    );
  }
  expect(outcome.commands).toHaveLength(1);
  return outcome.commands[0]!;
}

function message(input: string): string {
  const outcome = run(input);
  if (outcome.kind === "commands") {
    throw new Error(`expected a message for "${input}", got a command`);
  }
  return "message" in outcome ? outcome.message : "";
}

/* ------------------------------------------------------------- tokenising -- */

describe("tokenising", () => {
  it("strips punctuation, case and noise words", () => {
    expect(tokenize("  Take the LAMP, please!  ").words).toEqual(["take", "lamp"]);
  });

  it("folds apostrophes so vocabulary need not contain them", () => {
    expect(tokenize("don't").words).toEqual(["dont"]);
  });

  it("caps edit distance rather than computing the whole matrix", () => {
    expect(editDistance("token", "tokne", 2)).toBe(2);
    expect(editDistance("token", "elephant", 2)).toBe(3); // capped at max+1
  });
});

/* ------------------------------------------------------------------ verbs -- */

describe("verbs", () => {
  it("accepts the canonical word", () => {
    world.objects["basket"] = CARRIED;
    expect(one("drop basket")).toMatchObject({ verb: "drop" });
  });

  it("accepts synonyms the original never had", () => {
    world.objects["basket"] = CARRIED;
    for (const input of ["leave basket", "discard basket", "throw basket"]) {
      expect(one(input).verb).toBe("drop");
    }
    world.objects["basket"] = world.room;
    for (const input of ["get basket", "grab basket", "pick up basket"]) {
      expect(one(input).verb).toBe("take");
    }
  });

  it("still accepts the original's five-letter truncations", () => {
    // The tape stores EXAMI, UNLOC, INVEN, TICKL; players who learned those must
    // not be locked out.
    expect(one("exami rod").verb).toBe("examine");
    expect(one("inven").verb).toBe("inventory");
    expect(one("liste").verb).toBe("listen");
  });

  it("accepts any prefix of at least three characters", () => {
    expect(MIN_PREFIX).toBe(3);
    expect(one("exa rod").verb).toBe("examine");
    expect(one("inv").verb).toBe("inventory");
  });

  it("resolves LOOK to look when bare and examine when given a noun", () => {
    expect(one("look").verb).toBe("look");
    expect(one("look around").verb).toBe("look");
    expect(one("look rod").verb).toBe("examine");
    expect(one("look at rod").verb).toBe("examine");
    expect(one("x rod").verb).toBe("examine");
  });
});

/* ------------------------------------------------------------- directions -- */

describe("directions", () => {
  it("accepts a bare direction, a letter, and an explicit GO", () => {
    for (const input of ["north", "n", "go north", "walk north", "go to north"]) {
      expect(one(input)).toMatchObject({
        verb: "go",
        target: { kind: "direction", direction: "north" },
      });
    }
  });

  it("accepts all six", () => {
    const expected = ["north", "south", "east", "west", "up", "down"];
    const got = ["n", "s", "e", "w", "u", "d"].map((w) => {
      const target = one(w).target;
      return target.kind === "direction" ? target.direction : "?";
    });
    expect(got).toEqual(expected);
  });

  it("complains usefully when GO is given a non-direction", () => {
    expect(message("go tomb")).toMatch(/not a direction/);
  });
});

/* ------------------------------------------------------------ prepositions -- */

describe("prepositions", () => {
  it("parses the forms the original could not express", () => {
    world.objects["key"] = CARRIED;
    // UNLOCK BOX WITH KEY was unsayable in 1985; the key had to be inferred.
    expect(one("unlock box with key")).toMatchObject({
      verb: "unlock",
      target: { kind: "scenery" },
    });
    expect(one("unlock box").verb).toBe("unlock");
  });

  it("keeps the verb's own noun as the target, not the instrument", () => {
    world.objects["token-bronze"] = CARRIED;
    const command = one("rub token with rod");
    expect(command.target).toEqual({ kind: "object", key: "token-bronze" });
  });

  it("handles a preposition-first pattern", () => {
    // SWIM IN POOL -- the noun is after the preposition.
    const command = one("swim in pool");
    expect(command.verb).toBe("swim");
    expect(command.target).toMatchObject({ kind: "scenery" });
  });

  it("parses GIVE X TO Y and bare GIVE X alike", () => {
    world.objects["runes"] = CARRIED;
    expect(one("give runes to soothsayer").target).toEqual({
      kind: "object",
      key: "runes",
    });
    expect(one("give runes").target).toEqual({ kind: "object", key: "runes" });
  });
});

/* -------------------------------------------------------------- adjectives -- */

describe("adjectives", () => {
  beforeEach(() => {
    // Both tokens in scope at once -- impossible in the original, which is why it
    // never needed adjectives.
    world.objects["token-bronze"] = CARRIED;
    world.objects["token-gold"] = CARRIED;
  });

  it("distinguishes the pair the original could not", () => {
    expect(one("rub bronze token").target).toEqual({
      kind: "object",
      key: "token-bronze",
    });
    expect(one("insert gold token").target).toEqual({
      kind: "object",
      key: "token-gold",
    });
  });

  it("asks which one when the adjective is left out", () => {
    const outcome = run("rub token");
    expect(outcome.kind).toBe("clarify");
    if (outcome.kind !== "clarify") return;
    expect(outcome.message).toMatch(/Which do you mean/);
    expect(outcome.options.sort()).toEqual(["bronze token", "gold token"]);
  });

  it("accepts the answer to that question on the next turn", () => {
    expect(run("rub token").kind).toBe("clarify");
    const command = one("bronze");
    expect(command).toMatchObject({
      verb: "rub",
      target: { kind: "object", key: "token-bronze" },
    });
  });

  it("keeps the instrument when clarifying the main noun", () => {
    world.objects["rod"] = CARRIED;
    expect(run("rub token with rod").kind).toBe("clarify");
    const command = one("gold");
    expect(command).toMatchObject({
      verb: "rub",
      target: { kind: "object", key: "token-gold" },
    });
  });

  it("says what is actually here when the adjective matches nothing", () => {
    world.objects["token-gold"] = NOWHERE;
    const text = message("rub silver token");
    expect(text).toMatch(/can't see/);
    expect(text).toMatch(/bronze token/);
  });

  it("resolves a bare adjective when only one thing matches", () => {
    world.objects["token-gold"] = NOWHERE;
    expect(one("examine bronze").target).toEqual({
      kind: "object",
      key: "token-bronze",
    });
  });
});

/* ---------------------------------------------------------------- pronouns -- */

describe("derived adjectives", () => {
  it("accepts descriptive words taken from the object's description", () => {
    // "musical pipe", "wicker basket" -- the words are already in the text, so
    // the player should not have to know which ones the vocabulary happens to
    // contain. The original had no adjectives at all.
    world.objects["pipe"] = CARRIED;
    world.objects["basket"] = CARRIED;
    expect(one("blow the musical pipe").target).toEqual({
      kind: "object",
      key: "pipe",
    });
    expect(one("drop wicker basket").target).toEqual({
      kind: "object",
      key: "basket",
    });
  });
});

describe("pronouns", () => {
  it("binds IT to the last thing referred to", () => {
    world.objects["basket"] = world.room;
    one("examine basket");
    expect(one("take it").target).toEqual({ kind: "object", key: "basket" });
  });

  it("says so when IT refers to something no longer here", () => {
    world.objects["basket"] = world.room;
    one("examine basket");
    world.objects["basket"] = NOWHERE;
    expect(message("take it")).toMatch(/not sure what you mean by "it"/);
  });

  it("does not say \"an it here\" when nothing has been referred to yet", () => {
    expect(message("take it")).toMatch(/not sure what you mean by "it"/);
  });
});

/* --------------------------------------------------------------------- all -- */

describe("ALL", () => {
  it("expands TAKE ALL to one command per object present", () => {
    world.objects["basket"] = world.room;
    world.objects["pipe"] = world.room;
    const outcome = run("take all");
    expect(outcome.kind).toBe("commands");
    if (outcome.kind !== "commands") return;
    expect(outcome.commands.map((c) => c.target)).toEqual([
      { kind: "object", key: "basket" },
      { kind: "object", key: "pipe" },
    ]);
  });

  it("expands DROP ALL to what is carried, not what is here", () => {
    world.objects["basket"] = CARRIED;
    world.objects["pipe"] = world.room;
    const outcome = run("drop all");
    if (outcome.kind !== "commands") throw new Error("expected commands");
    expect(outcome.commands.map((c) => c.target)).toEqual([
      { kind: "object", key: "basket" },
      { kind: "object", key: "rod" },
    ]);
  });

  it("honours DROP ALL BUT ROD", () => {
    world.objects["basket"] = CARRIED;
    const outcome = run("drop all but rod");
    if (outcome.kind !== "commands") throw new Error("expected commands");
    expect(outcome.commands.map((c) => c.target)).toEqual([
      { kind: "object", key: "basket" },
    ]);
  });

  it("says so when there is nothing to take", () => {
    expect(message("take all")).toMatch(/nothing here to take/);
  });
});

/* ---------------------------------------------------------------- failures -- */

describe("failure messages", () => {
  it("reports a word it does not know", () => {
    // The original answered "Apologies from authors!" to this.
    expect(message("take flurble")).toMatch(/don't know the word "flurble"/);
  });

  it("still resolves a known noun that is not here", () => {
    // The original has no scope check: it dispatches on the noun code and lets
    // the handler decide, and TAKE HAY is what *creates* the hay. So an absent
    // object must still produce a command -- the engine reports the absence.
    // See tests/session.test.ts for the message the player actually gets.
    expect(one("take basket").target).toEqual({
      kind: "object",
      key: "basket",
    });
  });

  it("suggests a correction for a near miss", () => {
    expect(message("exemine rod")).toMatch(/Did you mean "examine"\?/);
    expect(message("take baskte")).toMatch(/Did you mean "basket"\?/);
  });

  it("accepts a word longer than the tape's truncated entry", () => {
    // The vocabulary stores five letters, so ANUBIS must find ANUBI. Without
    // this, TICKLE ANUBIS -- the only way past the Anubis -- is unsayable.
    expect(one("tickle anubis").target).toMatchObject({ kind: "scenery" });
    expect(one("examine silkworms").target).toMatchObject({ kind: "scenery" });
    expect(one("say abracadabra").target).toMatchObject({ kind: "scenery" });
  });

  it("does not guess at short words, where a typo is unclear", () => {
    // "cut" vs "cat" vs "cup" -- guessing is worse than asking.
    const text = message("zap rod");
    expect(text).toMatch(/don't know the word "zap"/);
    expect(text).not.toMatch(/Did you mean/);
  });

  it("asks for a noun when the verb needs one", () => {
    expect(message("unlock")).toMatch(/What do you want to unlock\?/);
  });

  it("says when a verb takes no noun", () => {
    expect(message("inventory rod")).toMatch(/only understood you as far as/);
  });

  it("prompts for a verb when given a bare noun", () => {
    world.objects["basket"] = world.room;
    expect(message("basket")).toMatch(/say what to do with the basket/);
  });

  it("answers an empty input politely", () => {
    expect(message("   ")).toMatch(/I beg your pardon/);
  });
});

/* -------------------------------------------------------------------- meta -- */

describe("meta commands", () => {
  it("recognises undo and again", () => {
    expect(run("undo")).toEqual({ kind: "meta", meta: "undo" });
    expect(run("oops")).toEqual({ kind: "meta", meta: "undo" });
    expect(run("again")).toEqual({ kind: "meta", meta: "again" });
    expect(run("g")).toEqual({ kind: "meta", meta: "again" });
  });
});

/* ------------------------------------------------------- the original's set -- */

describe("everything the original accepted still parses", () => {
  // Every two-word command from the walkthrough in docs/GAME-DATA.md §6.
  const walkthrough: [string, string][] = [
    ["take hay", "take"],
    ["feed cow", "feed"],
    ["give runes", "give"],
    ["unlock box", "unlock"],
    ["open case", "open"],
    ["rub token", "rub"],
    ["wave rod", "wave"],
    ["insert token", "insert"],
    ["examine down", "examine"],
    ["examine fluff", "examine"],
    ["tell joke", "tell"],
    ["play pipe", "play"],
    ["catch snake", "catch"],
    ["fill jug", "fill"],
    ["search case", "search"],
    ["tickle anubis", "tickle"],
    ["cut cloth", "cut"],
    ["cut shroud", "cut"],
    ["thread needle", "thread"],
    ["sew cloth", "sew"],
    ["make raiment", "make"],
    ["examine silkworms", "examine"],
    ["examine mulberry", "examine"],
    ["listen", "listen"],
    ["help", "help"],
    ["say abracadabra", "say"],
  ];

  // The later half of each transformation pair is left out of play: holding both
  // a bronze and a gold TOKEN at once genuinely is ambiguous, and the parser is
  // right to ask. Those cases are covered in the "adjectives" block above.
  const transformed = [
    "basket-with-snake",
    "needle-threaded",
    "cloth-shaped",
    "token-gold",
    "jug-silver",
  ];

  it.each(walkthrough)("%s parses as %s", (input, verb) => {
    // Everything else is in reach, so resolution is about the words not the state.
    for (const key of Object.keys(world.objects)) {
      world.objects[key] = transformed.includes(key) ? NOWHERE : CARRIED;
    }
    const outcome = parse(input, world, createParserState());
    expect(outcome.kind, `"${input}" -> ${JSON.stringify(outcome)}`).toBe(
      "commands",
    );
    if (outcome.kind !== "commands") return;
    expect(outcome.commands[0]!.verb).toBe(verb);
  });
});
