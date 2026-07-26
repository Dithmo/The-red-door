import { beforeEach, describe, expect, it } from "vitest";

import { objects, roomById } from "../src/data/index";
import { exitsSentence } from "../src/engine/describe";
import type { Command, CommandTarget, Direction } from "../src/data/types";
import { CARRIED, CARRY_LIMIT, NOWHERE } from "../src/data/types";
import { evaluate } from "../src/engine/conditions";
import { applyEffect } from "../src/engine/effects";
import { Game } from "../src/engine/game";
import { findShadowedRules, rules, validateRules } from "../src/rules/index";
import {
  carriedCount,
  contextOf,
  createWorld,
  nextRandom,
} from "../src/engine/world";
import {
  listSaves,
  load,
  memoryStore,
  save,
} from "../src/engine/save";

/* ------------------------------------------------------------- helpers -- */

function go(direction: Direction): Command {
  return {
    verb: "go",
    target: { kind: "direction", direction },
    raw: direction,
  };
}

function cmd(verb: string, target: CommandTarget = { kind: "none" }): Command {
  const raw =
    target.kind === "object"
      ? `${verb} ${target.key}`
      : target.kind === "scenery"
        ? `${verb} ${target.word}`
        : verb;
  return { verb, target, raw };
}

function obj(verb: string, key: string): Command {
  return cmd(verb, { kind: "object", key });
}

function scen(verb: string, code: number, word = "thing"): Command {
  return cmd(verb, { kind: "scenery", code, word });
}

function text(result: { lines: { text: string }[] }): string {
  return result.lines.map((l) => l.text).join(" | ");
}

let game: Game;
beforeEach(() => {
  game = new Game(rules, createWorld(1234));
});

/* ------------------------------------------------------------ the table -- */

describe("rule table", () => {
  it("passes validation against the generated data", () => {
    expect(validateRules()).toEqual([]);
  });

  it("has no unreachable rules", () => {
    expect(findShadowedRules(rules)).toEqual([]);
  });

  it("catches a rule shadowed by an earlier, weaker one", () => {
    // Guard the guard: the shadow check must actually detect the mistake it
    // exists to find -- a specific case written after the general one.
    const broken = [
      {
        id: "general",
        verb: "rub",
        target: { object: "rod" } as const,
        say: ["Nothing happens."],
        origin: "red.bas:6100",
      },
      {
        id: "specific",
        verb: "rub",
        target: { object: "rod" } as const,
        when: [{ room: 30 }],
        say: ["A flash of gold!"],
        origin: "red.bas:6105",
      },
    ];
    expect(findShadowedRules(broken)).toHaveLength(1);
    expect(findShadowedRules(broken)[0]).toContain("specific");
  });
});

/* -------------------------------------------------------------- effects -- */

describe("effects", () => {
  it("transforms an object in place whether held or on the floor", () => {
    // WAVE ROD converts the token wherever it is -- the original copies the old
    // location rather than assuming the player holds it.
    const held = createWorld();
    held.objects["token-bronze"] = CARRIED;
    applyEffect(held, { transform: "token-bronze", into: "token-gold" });
    expect(held.objects["token-gold"]).toBe(CARRIED);
    expect(held.objects["token-bronze"]).toBe(NOWHERE);

    const onFloor = createWorld();
    onFloor.objects["token-bronze"] = 30;
    applyEffect(onFloor, { transform: "token-bronze", into: "token-gold" });
    expect(onFloor.objects["token-gold"]).toBe(30);
    expect(onFloor.objects["token-bronze"]).toBe(NOWHERE);
  });

  it("rejects an unknown object key rather than silently creating one", () => {
    const world = createWorld();
    expect(() => applyEffect(world, { take: "sarcophagus" })).toThrow(
      /unknown object key/,
    );
  });

  it("derives the carried count instead of tracking it", () => {
    const world = createWorld();
    expect(carriedCount(world)).toBe(1); // the ROD
    applyEffect(world, { take: "basket" });
    expect(carriedCount(world)).toBe(2);
    applyEffect(world, { destroy: "basket" });
    expect(carriedCount(world)).toBe(1);
  });
});

/* ----------------------------------------------------------- conditions -- */

describe("conditions", () => {
  it("negates", () => {
    const ctx = contextOf(createWorld());
    expect(evaluate(ctx, { carrying: "rod" })).toBe(true);
    expect(evaluate(ctx, { not: { carrying: "rod" } })).toBe(false);
    expect(evaluate(ctx, { not: { carrying: "basket" } })).toBe(true);
  });

  it("treats an unset flag as zero, like the original's cleared array", () => {
    const ctx = contextOf(createWorld());
    expect(evaluate(ctx, { flag: "neverSet", eq: 0 })).toBe(true);
  });
});

/* -------------------------------------------------------- examining things -- */

describe("examining", () => {
  it("refuses to describe an object that is not here", () => {
    // BASIC 1302 gates the whole description block (1350-1398) on the object
    // being present, falling through to message 18 otherwise. Without that gate
    // the player could read every object's description from the first room,
    // which reveals the puzzle chain and implies they are holding things they
    // have never found.
    expect(text(game.execute(obj("examine", "token-bronze")))).toContain(
      "You can't see any token here",
    );
    expect(text(game.execute(obj("examine", "necklace")))).toContain(
      "You can't see any necklace here",
    );
  });

  it("describes what is held", () => {
    expect(text(game.execute(obj("examine", "rod")))).toContain("magic powers");
  });

  it("describes what is lying here", () => {
    game.world.room = 23; // the Ante-Chamber, where the PIPE lies
    expect(text(game.execute(obj("examine", "pipe")))).toContain("BLOW");
  });

  it("still answers for things that are not objects yet", () => {
    // The HAY does not exist until it is taken, but EXAMINE HAY in the byre
    // reaches the description block anyway (line 1310), and the fly and snake
    // have their own answers before they are reachable (1312, 1316).
    game.world.room = 9;
    expect(text(game.execute(obj("examine", "hay")))).toContain("feedstuff");

    game.world.room = 21;
    expect(text(game.execute(obj("examine", "fly")))).toContain("FLY-BY-NIGHT");

    game.world.room = 14;
    expect(text(game.execute(obj("examine", "snake")))).toContain("dangerous");
  });

  it("gates READ RUNES the same way, since it routes through EXAMINE", () => {
    expect(text(game.execute(obj("read", "runes")))).toContain(
      "You can't see any runes here",
    );
    game.world.objects["runes"] = CARRIED;
    expect(text(game.execute(obj("read", "runes")))).toContain(
      "can't understand them",
    );
  });
});

/* ---------------------------------------------------------------- exits -- */

describe("the exits line", () => {
  it("names the ways out of the starting room", () => {
    expect(text(game.describe())).toContain("You can go north, south or west.");
  });

  it("uses a plain sentence for a single exit", () => {
    game.world.room = 2;
    expect(text(game.describe())).toContain("You can go south.");
  });

  it("says so when there is no way on", () => {
    game.world.room = 30; // inside the mummy case
    expect(text(game.describe())).toContain("There is no way on that you can see.");
  });

  it("lists an exit even when a rule then refuses it", () => {
    // Room 1's west is in the exit table but blocked until both alcoves are
    // visited. Listing it is honest: the game explains itself when you try.
    expect(text(game.describe())).toContain("west");
    expect(text(game.execute(go("west")))).toContain("Both N and S before W!");
  });

  it("does not list a way through that only a rule creates", () => {
    // The silver doors out of the entrance hall are the Anubis's business, not
    // a direction, and the exit table does not hold them.
    game.world.room = 20;
    expect(text(game.describe())).toContain("You can go north, south or east.");
    expect(text(game.describe())).not.toContain("west");
  });

  it("keeps the garden maze unspoiled", () => {
    // All five garden rooms must read identically, or the exits line hands the
    // player a map the original never gave them.
    const sentences = new Set(
      [24, 25, 26, 27, 28].map((id) => {
        game.world.room = id;
        return exitsSentence(roomById.get(id)!);
      }),
    );
    expect(sentences.size).toBe(1);
    expect([...sentences][0]).toBe("You can go north, south, east or west.");
  });

  it("appears after the description and before the objects", () => {
    game.world.room = 23; // the Ante-Chamber, where the PIPE lies
    const kinds = game.describe().lines.map((l) => l.kind);
    expect(kinds).toEqual(["room", "exits", "objects", "objects"]);
  });
});

/* ------------------------------------------------------------- movement -- */

describe("movement", () => {
  it("refuses west from room 1 until both alcoves are visited", () => {
    expect(text(game.execute(go("west")))).toContain("Both N and S before W!");
    expect(game.world.room).toBe(1);

    game.execute(go("north")); // room 2, sets visitedNorthAlcove
    game.execute(go("south")); // back to 1
    expect(text(game.execute(go("west")))).toContain("Both N and S before W!");

    game.execute(go("south")); // room 3, sets visitedSouthAlcove
    game.execute(go("north")); // back to 1
    game.execute(go("west"));
    expect(game.world.room).toBe(4);
  });

  it("reports a direction with no exit", () => {
    expect(text(game.execute(go("up")))).toContain("You can't go THAT way!");
    expect(game.world.room).toBe(1);
  });

  it("describes the new room on arrival", () => {
    const result = game.execute(go("north"));
    expect(text(result)).toContain("male MUMMY");
    expect(result.image).toBe("chamber-male.svg");
  });

  it("lets a rule intercept before the exit table is consulted", () => {
    // The Anubis blocks west from room 20 even though the table has no west exit
    // there; the rule must be what answers, not the table's fallback.
    game.world.room = 20;
    expect(text(game.execute(go("west")))).toContain("ANUBIS blocks your way");
  });
});

/* ------------------------------------------------ the mummy-case sequence -- */

describe("the mummy case", () => {
  beforeEach(() => {
    game.world.room = 12;
  });

  it("hints before you open it", () => {
    expect(text(game.execute(scen("examine", 70, "case")))).toContain(
      "How about opening it?",
    );
  });

  it("pulls you inside and shows the case shut behind you", () => {
    const result = game.execute(scen("open", 70, "case"));
    expect(text(result)).toContain("There is a MUMMY inside it!");
    expect(text(result)).toContain("TIGHTLY CLOSES THE CASE");
    expect(game.world.room).toBe(30);
    expect(game.world.flags["caseOpened"]).toBe(1);
    // and the room description follows the messages
    expect(text(result)).toContain("inside the MUMMY");
  });

  it("needs the rod to turn the token gold", () => {
    game.world.room = 30;
    game.execute(obj("take", "token-bronze"));

    game.world.objects["rod"] = NOWHERE; // put the rod out of play
    expect(text(game.execute(obj("rub", "token-bronze")))).toContain(
      "making a ROD for your own back",
    );
    expect(game.world.flags["tokenIsGold"]).toBeUndefined();

    game.world.objects["rod"] = CARRIED;
    expect(text(game.execute(obj("rub", "token-bronze")))).toContain(
      "flash of GOLD",
    );
    expect(game.world.objects["token-gold"]).toBe(CARRIED);
    expect(game.world.objects["token-bronze"]).toBe(NOWHERE);
  });

  it("refuses the bronze token in the slot and accepts the gold one", () => {
    game.world.room = 30;
    game.execute(obj("take", "token-bronze"));
    expect(text(game.execute(obj("insert", "token-bronze")))).toContain(
      "Bronze is NOT good enough!",
    );
    expect(game.world.room).toBe(30);

    game.execute(obj("rub", "token-bronze"));
    const result = game.execute(obj("insert", "token-gold"));
    expect(text(result)).toContain("WELL DONE!");
    expect(game.world.room).toBe(11);
    expect(game.world.objects["token-gold"]).toBe(NOWHERE);
  });

  it("wave rod works on the token lying on the floor, not just held", () => {
    game.world.room = 30;
    expect(game.world.objects["token-bronze"]).toBe(30); // on the floor
    expect(text(game.execute(obj("wave", "rod")))).toContain("flash of GOLD");
    expect(game.world.objects["token-gold"]).toBe(30);
  });

  it("says nothing happens when waving the rod outside the case", () => {
    game.world.room = 1;
    expect(text(game.execute(obj("wave", "rod")))).toContain("Nothing happens!");
  });
});

/* ----------------------------------------------------- the snake and pit -- */

describe("the snake", () => {
  beforeEach(() => {
    game.world.room = 14;
    game.world.objects["pipe"] = CARRIED;
  });

  it("cannot be reached before the pipe is played", () => {
    expect(text(game.execute(obj("take", "snake")))).toContain(
      "You can't quite reach them.",
    );
  });

  it("comes up the ramp when the pipe is played", () => {
    expect(text(game.execute(obj("play", "pipe")))).toContain(
      "slithers up the ramp",
    );
    expect(game.world.objects["snake"]).toBe(14);
    expect(game.world.flags["snakeOnRamp"]).toBe(1);
  });

  it("kills you if you grab it bare-handed", () => {
    game.execute(obj("play", "pipe"));
    const result = game.execute(obj("take", "snake"));
    expect(text(result)).toContain("bitten on the wrist");
    expect(result.ended?.outcome).toBe("lose");
    expect(game.world.ended?.outcome).toBe("lose");
  });

  it("goes into the basket, dropping the CHARM", () => {
    game.world.objects["basket"] = CARRIED;
    game.execute(obj("play", "pipe"));
    const result = game.execute(obj("take", "snake"));
    expect(text(result)).toContain("CHARM which drops at your feet");
    expect(game.world.objects["basket-with-snake"]).toBe(CARRIED);
    expect(game.world.objects["basket"]).toBe(NOWHERE);
    expect(game.world.objects["snake"]).toBe(NOWHERE);
    expect(game.world.objects["charm"]).toBe(14);
  });

  it("refuses further commands once the game is over", () => {
    game.execute(obj("play", "pipe"));
    game.execute(obj("take", "snake"));
    const after = game.execute(go("north"));
    expect(text(after)).toContain("The game is over");
    expect(game.world.room).toBe(14);
  });
});

/* ---------------------------------------------------- climbing into death -- */

describe("the snake pit", () => {
  it("kills you on arrival when you go down from room 14", () => {
    game.world.room = 14;
    const result = game.execute(go("down"));
    expect(game.world.room).toBe(31);
    expect(text(result)).toContain("SNAKE PIT");
    expect(text(result)).toContain("asp time");
    expect(result.ended?.outcome).toBe("lose");
  });
});

/* -------------------------------------------------------- THOTH's chamber -- */

describe("THOTH's audiences", () => {
  /** Get into the high chamber the way the game does: TICKLE ANUBIS. */
  function seekAudience() {
    game.world.room = 20;
    game.world.flags["soothsayerHelped"] = 1;
    return game.execute(scen("tickle", 90, "anubis"));
  }

  it("shows you out to the Funeral Parlour, and describes it", () => {
    const result = seekAudience();
    expect(text(result)).toContain("Welcome to my tomb");
    expect(game.world.objects["scissors"]).toBe(CARRIED);
    expect(game.world.room).toBe(22);
    // Being shown out has to say where you have been shown out *to*.
    expect(text(result)).toContain("the very depressing Funeral Parlour");
    expect(text(result)).toContain(exitsSentence(roomById.get(22)!));
    // Only one clause of the original's THOTH routine ever runs.
    expect(text(result)).not.toContain("where's my gift");
  });

  it("runs exactly one clause on the second empty-handed visit", () => {
    seekAudience();
    const result = seekAudience();
    expect(text(result)).toContain("where's my gift");
    expect(text(result)).not.toContain("Welcome to my tomb");
    expect(text(result)).not.toContain("YOU AGAIN");
    expect(game.world.room).toBe(22);
    expect(result.ended).toBeUndefined();
  });

  it("banishes you on the third empty-handed visit", () => {
    seekAudience();
    seekAudience();
    const result = seekAudience();
    expect(text(result)).toContain("YOU AGAIN");
    expect(result.ended?.outcome).toBe("lose");
  });

  it("ends the game on the gift, with no further demand for one", () => {
    seekAudience();
    game.world.objects["raiment"] = CARRIED;
    const result = seekAudience();

    expect(text(result)).toContain("HAPPY DREAMS");
    expect(result.ended?.outcome).toBe("win");
    // The bug this pins: winning also printed the second-audience demand,
    // because arrival rules carried on firing after `end`.
    expect(text(result)).not.toContain("where's my gift");
    expect(text(result)).not.toContain("Welcome to my tomb");
    expect(game.world.room).toBe(29);
  });
});

/* ----------------------------------------------------------------- undo -- */

describe("undo", () => {
  it("takes back a move", () => {
    game.execute(go("north"));
    expect(game.world.room).toBe(2);
    game.undo();
    expect(game.world.room).toBe(1);
  });

  it("takes back a death", () => {
    game.world.room = 14;
    game.execute(go("down"));
    expect(game.world.ended).toBeDefined();
    game.undo();
    expect(game.world.ended).toBeUndefined();
    expect(game.world.room).toBe(14);
  });

  it("reports when there is nothing to undo", () => {
    expect(text(game.undo())).toContain("nothing to undo");
  });

  it("does not record a turn for a refused command", () => {
    // A confirmation prompt must not consume an undo step, or "undo" after
    // being asked would rewind the previous real move instead.
    game.world.objects["coin"] = CARRIED;
    game.execute(obj("insert", "coin"));
    expect(game.canUndo).toBe(false);
  });
});

/* -------------------------------------------------------------- kindness -- */

describe("confirmation before an unwinnable mistake", () => {
  beforeEach(() => {
    game.world.objects["coin"] = CARRIED;
  });

  it("asks first and changes nothing", () => {
    const first = game.execute(obj("insert", "coin"));
    expect(text(first)).toContain("Repeat the command");
    expect(game.world.objects["coin"]).toBe(CARRIED);
  });

  it("goes through when the command is repeated", () => {
    game.execute(obj("insert", "coin"));
    const second = game.execute(obj("insert", "coin"));
    expect(text(second)).toContain("Nothing happens!");
    expect(game.world.objects["coin"]).toBe(NOWHERE);
  });

  it("resets if you do something else in between", () => {
    game.execute(obj("insert", "coin"));
    game.execute(cmd("look"));
    game.execute(obj("insert", "coin"));
    expect(game.world.objects["coin"]).toBe(CARRIED);
  });
});

/* ------------------------------------------------------------- inventory -- */

describe("carrying", () => {
  it("starts with only the ROD", () => {
    expect(text({ lines: game.inventory() })).toContain("A short golden ROD");
  });

  it("enforces the original's limit of six", () => {
    const world = game.world;
    // fill up with five more, so six in total
    const fillers = objects
      .filter((o) => o.key !== "rod")
      .slice(0, CARRY_LIMIT - 1);
    for (const o of fillers) world.objects[o.key] = CARRIED;
    expect(carriedCount(world)).toBe(CARRY_LIMIT);

    world.objects["pipe"] = world.room;
    expect(text(game.execute(obj("take", "pipe")))).toContain(
      "can't carry any more",
    );
  });

  it("will not take what is not here", () => {
    // The original answered message 18, "You must be seeing things!", to this.
    // Naming what is missing is more use.
    expect(text(game.execute(obj("take", "pipe")))).toContain(
      "You can't see any pipe here.",
    );
  });
});

/* ------------------------------------------------------------ randomness -- */

describe("determinism", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createWorld(99);
    const b = createWorld(99);
    const seqA = [nextRandom(a), nextRandom(a), nextRandom(a)];
    const seqB = [nextRandom(b), nextRandom(b), nextRandom(b)];
    expect(seqA).toEqual(seqB);
  });

  it("gives an unrecognised command one of the original's three brush-offs", () => {
    const result = game.execute(cmd("kiss", { kind: "object", key: "rod" }));
    expect(text(result)).toMatch(
      /Try something else|won't do any good|No can do/,
    );
  });
});

/* ------------------------------------------------------------------ save -- */

describe("save and load", () => {
  it("round-trips the world, including the PRNG seed", () => {
    const store = memoryStore();
    game.execute(go("north"));
    nextRandom(game.world);
    save(store, "slot1", game.world);

    const result = load(store, "slot1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.world.room).toBe(game.world.room);
    expect(result.world.seed).toBe(game.world.seed);
    expect(result.world.turn).toBe(game.world.turn);
    expect(result.world.objects).toEqual(game.world.objects);
  });

  it("reports a missing slot rather than throwing", () => {
    const store = memoryStore();
    const result = load(store, "nope");
    expect(result).toEqual({ ok: false, reason: "no-such-slot" });
  });

  it("reports a corrupt slot rather than throwing", () => {
    const store = memoryStore({ "red-door/save/bad": "{{{" });
    expect(load(store, "bad")).toEqual({ ok: false, reason: "corrupt" });
  });

  it("lists slots without being derailed by a corrupt one", () => {
    const store = memoryStore({ "red-door/save/bad": "not json" });
    save(store, "good", game.world);
    const listed = listSaves(store);
    expect(listed.map((s) => s.name)).toEqual(["good"]);
  });
});
