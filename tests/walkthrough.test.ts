import { describe, expect, it } from "vitest";

import { createWorld } from "../src/engine/world";
import { rules, transcribedLines, validateRules } from "../src/rules/index";
import { Session } from "../src/session";

/**
 * The walkthrough is the real proof the transcription is faithful: if the rules
 * are wrong, the winning path does not reach HAPPY DREAMS.
 *
 * Derived from the dependency graph in docs/GAME-DATA.md §6.
 */

/** Play a list of commands, returning the whole transcript. */
function play(inputs: string[], seed = 99) {
  const session = new Session(createWorld(seed));
  const transcript: string[] = [];
  const begin = session.begin();
  transcript.push(...begin.lines.map((l) => l.text));

  for (const input of inputs) {
    const result = session.send(input);
    transcript.push(`> ${input}`);
    transcript.push(...result.lines.map((l) => l.text));
    if (result.ended) break;
  }
  return { session, transcript, text: transcript.join("\n") };
}

/**
 * The full winning route.
 *
 * It has to manage inventory: the carrying limit is six (`max` in the tape's
 * saved variables) and both mummies want four items at once, so things get
 * stashed in room 1 and at the western hub and collected again.
 */
const WINNING_PATH = [
  // Both alcoves must be visited before the corridor west opens (line 1004)
  "n", "s", "s", "n",
  // West along the long corridor
  "w", "w", "w", "w",
  // The BASKET, then the RUNES in the BLACK room
  "take basket", "s", "take runes", "examine symbols", "n",
  // The RUNES buy a KEY and the "TICKLE ANUBIS" hint
  "e", "e", "e", "s", "give runes to soothsayer", "n",
  // The SCARLET ROOM box holds a BRACELET; the KEY drops
  "w", "s", "unlock box with key", "n",
  // A NEEDLE falls out of the haystack; the fed cow reveals a COIN
  "n", "n", "take hay", "take needle", "s", "feed cow", "take coin", "s",
  // Stash what is not needed yet in room 1, next door to both mummies
  "e", "e", "drop rod", "drop needle", "drop basket",
  // Tickling the ANUBIS earns THOTH's golden SCISSORS
  "w", "w", "w", "w", "w", "tickle anubis",
  // FOOD and PIPE, left at the western hub
  "take food", "e", "take pipe", "w", "n", "n", "drop food", "drop pipe",
  // The Treasure Room's empty case still holds a NECKLACE
  "n", "examine case", "take necklace", "s",
  // The room full of DOWN yields FLUFF, and the FLUFF a RUBY
  "e", "descend stairs", "examine down", "take fluff", "examine fluff", "take ruby", "drop fluff", "climb stairs",
  // The Concubine trades KOHL for the COIN and PERFUME for the RUBY
  "w", "n", "n", "give coin to concubine", "give ruby to concubine",
  // Four adornments delivered: the female mummy tells you the JOKE
  "s", "s", "e", "e", "e", "e", "e", "s", "n",
  // Collect the stash on the way through
  "take basket", "take rod",
  // The JOKE kills the fly on the SPHINX's nose
  "w", "w", "w", "w", "w", "s", "tell joke", "take fly", "n", "take pipe",
  // The dead FLY buys the silver JUG from the spider
  "e", "e", "e", "e", "n", "give fly to spider", "take jug", "s",
  // The PIPE charms a snake up the ramp; the BASKET catches it, dropping the CHARM
  "w", "w", "s", "play pipe", "catch snake", "take charm", "n",
  // Fill the JUG from the pool of embalming fluid
  "w", "w", "n", "n", "e", "fill jug",
  // Into the MUMMY CASE
  "w", "s", "s", "e", "e", "n", "drop pipe", "drop basket", "open case",
  // The SHROUD becomes BANDAGES, the TOKEN turns gold, and the gold TOKEN buys your way out
  "take shroud", "cut shroud", "wave rod", "take gold token", "insert gold token",
  // Retrieve the FOOD
  "w", "w", "take food",
  // Four possessions delivered: the male mummy leaves the CLOTH of gold
  "e", "e", "e", "e", "e", "n", "take cloth", "s", "take needle",
  // Through the garden maze: N, E, N, E from the patio
  "w", "w", "w", "w", "w", "n", "n", "e", "n", "e", "n", "e",
  // The silkworms' THREAD
  "examine garden", "examine mulberry", "take thread",
  // Make the gift
  "cut cloth", "thread needle", "sew cloth",
  // Back out of the maze and through the ANUBIS to THOTH
  "s", "w", "s", "w", "s", "s", "tickle anubis",
];

describe("the winning path", () => {
  const { session, text } = play(WINNING_PATH);

  it("reaches HAPPY DREAMS", () => {
    expect(text).toContain("HAPPY DREAMS");
    expect(session.world.ended?.outcome).toBe("win");
  });

  it("passes through every puzzle on the way", () => {
    const beats = [
      "Vandals desecrated my tomb", // the mummies' plea
      "gives you a KEY", // Soothsayer
      "The BOX unlocks", // Scarlet Room
      "haystack collapses", // the needle
      "The cow rises to eat the HAY", // the coin
      "golden SCISSORS", // Thoth's first audience
      "so you pick it up", // the necklace in the glass case
      "You find some navel FLUFF", // room 16
      "A navel-shaped RUBY falls out", // the ruby
      "some KOHL", // Concubine
      "some PERFUME", // Concubine
      "rather funny JOKE", // female mummy satisfied
      "joke KILLS the fly", // the Sphinx
      "JUG in a dark corner", // the spider
      "slithers up the ramp", // the pipe
      "CHARM which drops at your feet", // the snake in the basket
      "embalming fluid", // filling the jug
      "TIGHTLY CLOSES THE CASE", // the mummy case
      "now have some bandages", // cutting the shroud
      "flash of GOLD", // the token
      "WELL DONE!", // out of the case
      "CLOTH of gold", // male mummy satisfied
      "MULBERRY bush", // the garden
      "making very fine THREAD", // the silkworms
      "seamed like a good idea", // cutting the cloth
      "wasn't easy! But it's done", // threading the needle
      "raiment fit for a GOD", // sewing it
      "THOTH takes the GIFT", // the ending
    ];
    const missing = beats.filter((beat) => !text.includes(beat));
    expect(missing).toEqual([]);
  });

  it("never hits a parser failure or an unhandled command", () => {
    // Every line of the walkthrough should be understood and answered by a rule,
    // not fall through to the original's three-way brush-off.
    for (const brush of [
      "I don't know the word",
      "You can't see",
      "Try something else",
      "That won't do any good",
      "Sorry! No can do",
      "I beg your pardon",
      "not sure what you mean",
      "Which do you mean",
    ]) {
      expect(text, `walkthrough hit: ${brush}`).not.toContain(brush);
    }
  });
});

describe("the transcription", () => {
  it("passes validation", () => {
    expect(validateRules()).toEqual([]);
  });

  it("covers the substantive BASIC handlers", () => {
    const lines = transcribedLines();
    // Verb handlers, the scenery blocks, and the room-description events.
    const inRange = (lo: number, hi: number) =>
      lines.filter((n) => n >= lo && n <= hi).length;
    expect(inRange(1000, 6199), "verb handlers").toBeGreaterThan(70);
    expect(inRange(8000, 8399), "TAKE scenery").toBeGreaterThan(25);
    expect(inRange(8400, 8799), "EXAMINE scenery").toBeGreaterThan(60);
    expect(inRange(7000, 7399), "arrival events").toBeGreaterThan(5);
    expect(rules.length).toBeGreaterThan(300);
  });
});

describe("the four rule-driven deaths", () => {
  it("kills you for grabbing a snake bare-handed", () => {
    const { session, text } = play([
      "west",
      "north",
      "south",
      "south",
      "north",
      "west",
      "west",
      "west",
      "south",
      "take pipe",
    ]);
    // Reach the pit without the basket.
    session.world.room = 14;
    session.world.objects["pipe"] = 99;
    session.world.objects["basket"] = 0;
    session.send("play pipe");
    const result = session.send("catch snake");
    expect(result.lines.map((l) => l.text).join(" ")).toContain(
      "bitten on the wrist",
    );
    expect(result.ended?.outcome).toBe("lose");
    void text;
  });

  it("kills you for drinking the pool", () => {
    const session = new Session(createWorld(1));
    session.world.room = 13;
    const result = session.send("drink the liquid");
    expect(result.lines.map((l) => l.text).join(" ")).toContain("MUMMIFIED");
    expect(result.ended?.outcome).toBe("lose");
  });

  it("kills you for swimming in the pool", () => {
    const session = new Session(createWorld(1));
    session.world.room = 13;
    const result = session.send("swim in the pool");
    expect(result.lines.map((l) => l.text).join(" ")).toContain(
      "no state to carry on",
    );
    expect(result.ended?.outcome).toBe("lose");
  });

  it("kills you on a third empty-handed audience with THOTH", () => {
    const session = new Session(createWorld(1));
    session.world.room = 20;
    session.world.flags["soothsayerHelped"] = 1;

    session.send("tickle anubis"); // first audience -- scissors, sent to room 22
    expect(session.world.flags["thothAudiences"]).toBe(1);

    session.world.room = 20;
    session.send("tickle anubis"); // second -- impatient
    expect(session.world.flags["thothAudiences"]).toBe(2);

    session.world.room = 20;
    const result = session.send("tickle anubis"); // third -- banished
    expect(result.lines.map((l) => l.text).join(" ")).toContain("I banish you");
    expect(result.ended?.outcome).toBe("lose");
  });

  it("kills you for climbing into the snake pit", () => {
    const session = new Session(createWorld(1));
    session.world.room = 14;
    const result = session.send("down");
    expect(result.ended?.outcome).toBe("lose");
  });
});

describe("the unwinnable trap", () => {
  it("warns before letting you eat the funeral food", () => {
    const session = new Session(createWorld(1));
    session.world.room = 22;
    session.send("take food");

    const first = session.send("eat food");
    expect(first.lines.map((l) => l.text).join(" ")).toMatch(
      /cannot then be finished/,
    );
    expect(session.world.objects["food"]).toBe(99);

    const second = session.send("eat food");
    expect(second.lines.map((l) => l.text).join(" ")).toContain(
      "Do you think that was wise?",
    );
    expect(session.world.objects["food"]).toBe(0);
    expect(session.world.flags["foodEaten"]).toBe(1);
  });
});
