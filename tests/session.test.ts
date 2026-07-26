import { beforeEach, describe, expect, it } from "vitest";

import { CARRIED } from "../src/data/types";
import { createWorld } from "../src/engine/world";
import { Session } from "../src/session";

let session: Session;

beforeEach(() => {
  session = new Session(createWorld(42));
});

function say(input: string): string {
  return session
    .send(input)
    .lines.map((l) => l.text)
    .join(" | ");
}

describe("playing in typed English", () => {
  it("plays the opening the way a person would type it", () => {
    expect(session.begin().lines[0]!.text).toContain("EGYPTIAN TOMB");

    expect(say("go west")).toContain("Both N and S before W!");
    expect(say("n")).toContain("male MUMMY");
    expect(say("s")).toContain("EGYPTIAN TOMB");
    expect(say("south")).toContain("female MUMMY");
    expect(say("north")).toContain("EGYPTIAN TOMB");
    expect(say("w")).toContain("east end of a long corridor");
    expect(session.world.room).toBe(4);
  });

  it("plays the mummy-case puzzle from typed input alone", () => {
    session.world.room = 12;

    expect(say("examine the mummy case")).toContain("How about opening it?");
    expect(say("open case")).toContain("TIGHTLY CLOSES THE CASE");
    expect(session.world.room).toBe(30);

    expect(say("examine catch")).toContain("there's the RUB!");
    expect(say("wave rod")).toContain("flash of GOLD");
    expect(say("take the gold token")).toContain("OK");
    expect(say("put token in slot")).toContain("WELL DONE!");
    expect(session.world.room).toBe(11);
  });

  it("asks which token when both are held, then acts on the answer", () => {
    session.world.room = 30;
    session.world.objects["token-bronze"] = CARRIED;
    session.world.objects["token-gold"] = CARRIED;

    expect(say("rub token")).toMatch(/Which do you mean/);
    // Asking is not a turn.
    expect(session.world.turn).toBe(0);

    expect(say("gold")).toContain("Surely not!");
  });

  it("does not let a question consume a turn or an undo step", () => {
    session.world.room = 30;
    session.world.objects["token-bronze"] = CARRIED;
    session.world.objects["token-gold"] = CARRIED;

    say("look");
    const turnAfterLook = session.world.turn;
    say("rub token");
    expect(session.world.turn).toBe(turnAfterLook);
  });

  it("supports undo through the session", () => {
    session.begin();
    say("north");
    expect(session.world.room).toBe(2);
    expect(say("undo")).toContain("Taken back");
    expect(session.world.room).toBe(1);
  });

  it("supports AGAIN", () => {
    session.world.room = 14;
    session.world.objects["pipe"] = CARRIED;
    expect(say("play pipe")).toContain("slithers up the ramp");
    // Second time the snake is already up, so the generic response applies.
    expect(say("again")).toBeTruthy();
    expect(session.world.flags["snakeOnRamp"]).toBe(1);
  });

  it("reports nothing to repeat before any command", () => {
    expect(say("again")).toContain("nothing to repeat");
  });

  it("labels each item when a command expands to several", () => {
    session.world.room = 23; // the Ante-Chamber, where the PIPE lies
    session.world.objects["basket"] = 23; // a second thing to pick up
    const result = session.send("take all");
    const text = result.lines.map((l) => l.text).join("\n");
    expect(text).toContain("take basket:");
    expect(text).toContain("take pipe:");
    expect(session.world.objects["pipe"]).toBe(CARRIED);
    expect(session.world.objects["basket"]).toBe(CARRIED);
  });

  it("does not label a single-item expansion", () => {
    session.world.room = 23;
    const text = session
      .send("take all")
      .lines.map((l) => l.text)
      .join("\n");
    expect(text).not.toContain("take pipe:");
    expect(session.world.objects["pipe"]).toBe(CARRIED);
  });

  it("survives a death and can undo it", () => {
    session.world.room = 14;
    const result = session.send("down");
    expect(result.ended?.outcome).toBe("lose");
    expect(say("undo")).toContain("Taken back");
    expect(session.world.ended).toBeUndefined();
  });

  it("answers nonsense specifically rather than with one catch-all", () => {
    // The original said "Apologies from authors!" to every one of these.
    expect(say("xyzzy")).toMatch(/don't know the word "xyzzy"/);
    expect(say("take lamp")).toMatch(/don't know the word "lamp"/);
    expect(say("take basket")).toMatch(/can't see a basket here/);
    expect(say("unlock")).toMatch(/What do you want to unlock\?/);
  });

  it("threads pronouns across turns", () => {
    session.world.room = 23;
    expect(say("examine pipe")).toBeTruthy();
    expect(say("take it")).toBeTruthy();
    expect(session.world.objects["pipe"]).toBe(CARRIED);
  });
});
