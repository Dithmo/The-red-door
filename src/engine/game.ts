/**
 * The turn pipeline.
 *
 * A turn is: find a rule, or fall back to a built-in default. Rules get first
 * refusal even for movement, because the original checks its special cases
 * (lines 1004/1006 -- "Both N and S before W!", "The ANUBIS blocks your way.")
 * *before* consulting the exit table at line 1090.
 *
 * The parser (phase 3) produces the Command this consumes; phase 4 fills out the
 * rule table. Everything here is deterministic: no Math.random, so a failing
 * test always reproduces.
 */

import { messages, objectByKey, roomById } from "../data/index";
import type { Command, Direction, Rule, Say } from "../data/types";
import { CARRIED, CARRY_LIMIT } from "../data/types";
import { evaluateAll, isCarried, isPresent } from "./conditions";
import { describeRoom, resolveImage } from "./describe";
import { applyEffects } from "./effects";
import { findRule } from "./rules";
import type { World } from "./world";
import {
  carriedKeys,
  cloneWorld,
  contextOf,
  createWorld,
  currentRoom,
  isFull,
  objectsHere,
  randomInt,
} from "./world";

export type LineKind = "room" | "objects" | "response" | "system" | "death";

export interface OutputLine {
  text: string;
  kind: LineKind;
}

export interface TurnResult {
  lines: OutputLine[];
  /** Image to show, if the room changed or its state did. */
  image?: string;
  /** The rule that fired, for debugging and for the transcription audit. */
  firedRule?: string;
  ended?: { outcome: "win" | "lose" };
}

const MAX_UNDO = 64;

/**
 * Reserved verb for arrival events -- things the original does in a room's
 * description routine rather than in a verb handler. No command ever carries it,
 * so these never match a player action.
 */
export const ARRIVAL_VERB = "@enter";

/** The original's fallback trio, picked at random (BASIC line 8309). */
const FALLBACK_MESSAGES = [13, 14, 15];

function say(text: string, kind: LineKind = "response"): OutputLine {
  return { text, kind };
}

function renderSay(entries: readonly Say[] | undefined): OutputLine[] {
  return (entries ?? []).map((entry) => {
    if (typeof entry === "string") return say(entry);
    const text = messages[String(entry.message)];
    if (text === undefined) {
      throw new Error(`rule references unknown message ${entry.message}`);
    }
    return say(text);
  });
}

export class Game {
  world: World;
  readonly rules: readonly Rule[];

  private undoStack: World[] = [];
  /**
   * A command awaiting confirmation. The original has no such thing -- this is
   * the agreed kindness for moves that silently make the game unwinnable.
   */
  private pendingConfirm: { ruleId: string; raw: string } | undefined;

  constructor(rules: readonly Rule[], world: World = createWorld()) {
    this.rules = rules;
    this.world = world;
  }

  /* ------------------------------------------------------------ describing -- */

  /** The room as it currently reads, plus anything lying in it. */
  describe(): TurnResult {
    const world = this.world;
    const room = currentRoom(world);
    const ctx = contextOf(world);
    const lines: OutputLine[] = [say(describeRoom(room, ctx), "room")];

    const here = objectsHere(world);
    if (here.length > 0) {
      lines.push(say("Here you can see:", "objects"));
      for (const obj of here) lines.push(say(obj.description, "objects"));
    }

    return { lines, image: resolveImage(room, ctx).src };
  }

  inventory(): OutputLine[] {
    const keys = carriedKeys(this.world);
    if (keys.length === 0) {
      return [say("You have with you: nothing at all.")];
    }
    const lines = [say("You have with you:")];
    for (const key of keys) {
      const obj = objectByKey.get(key);
      lines.push(say(obj ? obj.description : key));
    }
    return lines;
  }

  /* ------------------------------------------------------------------ undo -- */

  private snapshot(): void {
    this.undoStack.push(cloneWorld(this.world));
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  undo(): TurnResult {
    const previous = this.undoStack.pop();
    if (!previous) {
      return { lines: [say("There is nothing to undo.", "system")] };
    }
    this.world = previous;
    this.pendingConfirm = undefined;
    const described = this.describe();
    return {
      lines: [say("Taken back.", "system"), ...described.lines],
      ...(described.image ? { image: described.image } : {}),
    };
  }

  /* ------------------------------------------------------------------ turn -- */

  execute(command: Command): TurnResult {
    const world = this.world;

    if (world.ended) {
      return {
        lines: [say("The game is over. Undo, or start again.", "system")],
        ended: world.ended,
      };
    }

    const ctx = contextOf(world);
    const rule = findRule(this.rules, command, ctx);

    // A rule that needs confirming does nothing the first time it is asked for.
    if (rule?.confirm) {
      const pending = this.pendingConfirm;
      const alreadyAsked =
        pending && pending.ruleId === rule.id && pending.raw === command.raw;
      if (!alreadyAsked) {
        this.pendingConfirm = { ruleId: rule.id, raw: command.raw };
        return {
          lines: [say(rule.confirm, "system")],
          firedRule: rule.id,
        };
      }
    }
    this.pendingConfirm = undefined;

    this.snapshot();
    world.turn += 1;

    const roomBefore = world.room;
    let lines: OutputLine[];
    let firedRule: string | undefined;

    if (rule) {
      firedRule = rule.id;
      applyEffects(world, rule.then);
      lines = renderSay(rule.say);
      if (rule.sayRandom && rule.sayRandom.length > 0) {
        const pick = rule.sayRandom[randomInt(world, rule.sayRandom.length)]!;
        lines = [...lines, ...renderSay(pick)];
      }
    } else {
      lines = this.builtin(command);
    }

    // Movement -- whether by exit table or by a rule's teleport -- redescribes.
    if (world.room !== roomBefore && !world.ended) {
      const arrival = this.onArrival();
      lines = [...lines, ...arrival.lines];
      return {
        lines,
        ...(arrival.image ? { image: arrival.image } : {}),
        ...(firedRule ? { firedRule } : {}),
        ...(world.ended ? { ended: world.ended } : {}),
      };
    }

    const image = resolveImage(currentRoom(world), contextOf(world)).src;
    return {
      lines,
      image,
      ...(firedRule ? { firedRule } : {}),
      ...(world.ended ? { ended: world.ended } : {}),
    };
  }

  /**
   * Arriving somewhere.
   *
   * Arrival events are a separate path from commands, because in the original
   * they live in the room's *description* routine, not in the verb handlers --
   * line 7022 prints the male mummy's plea and sets f+8 as a side effect of
   * looking at the room. Modelling them as ordinary rules made them intercept
   * the player's next command instead, which stranded you in the alcove.
   *
   * Unlike command rules, all matching arrival events fire, in order: the
   * original's description routines are sequential IFs that all run.
   *
   * Room 31 (the snake pit) kills on entry -- its description routine ends in
   * GO TO 1602 rather than returning.
   */
  private onArrival(): TurnResult {
    const world = this.world;
    const room = currentRoom(world);

    const described = this.describe();
    const extra: OutputLine[] = [];

    for (const rule of this.rules) {
      if (rule.verb !== ARRIVAL_VERB) continue;
      if (!evaluateAll(contextOf(world), rule.when)) continue;
      applyEffects(world, rule.then);
      extra.push(...renderSay(rule.say));
    }

    const lines = [...described.lines, ...extra];

    if (room.fatal) {
      world.ended = { outcome: "lose" };
      return {
        lines: [...lines, say(room.fatal.text, "death")],
        ...(described.image ? { image: described.image } : {}),
        ended: world.ended,
      };
    }

    // An arrival event may have changed what the room looks like.
    return { lines, image: resolveImage(room, contextOf(world)).src };
  }

  /** Apply arrival events for the starting room, before the first prompt. */
  begin(): TurnResult {
    return this.onArrival();
  }

  /* -------------------------------------------------------------- builtins -- */

  /** What happens when no rule matched. Mirrors the original's default paths. */
  private builtin(command: Command): OutputLine[] {
    switch (command.verb) {
      case "go":
        return this.move(command);
      case "look":
        return this.describe().lines;
      case "inventory":
        return this.inventory();
      case "take":
        return this.defaultTake(command);
      case "drop":
        return this.defaultDrop(command);
      default:
        return this.unhandled(command);
    }
  }

  /**
   * No rule claimed the command. If it named something that is not here, say so
   * -- the original answered message 18 ("You must be seeing things!") or one of
   * its three brush-offs, none of which told the player the thing was absent.
   */
  private unhandled(command: Command): OutputLine[] {
    if (command.target.kind === "object") {
      const key = command.target.key;
      if (!isPresent(contextOf(this.world), key)) {
        const obj = objectByKey.get(key);
        return [say(`You can't see any ${obj ? obj.noun : key} here.`)];
      }
    }
    return [say(this.fallbackMessage())];
  }

  private move(command: Command): OutputLine[] {
    if (command.target.kind !== "direction") {
      return [say("Which way?")];
    }
    const room = currentRoom(this.world);
    const target = room.exits[command.target.direction as Direction];
    if (!target || !roomById.has(target)) {
      return [say("You can't go THAT way!")];
    }
    this.world.room = target;
    return [];
  }

  private defaultTake(command: Command): OutputLine[] {
    if (command.target.kind !== "object") {
      return this.unhandled(command);
    }
    const key = command.target.key;
    const ctx = contextOf(this.world);

    if (isCarried(ctx, key)) return [say(messages["22"] ?? "You've already done that!")];
    if (!isPresent(ctx, key)) return this.unhandled(command);
    if (isFull(this.world)) return [say(messages["5"] ?? "You can't carry any more!")];

    this.world.objects[key] = CARRIED;
    return [say(messages["12"] ?? "OK.")];
  }

  private defaultDrop(command: Command): OutputLine[] {
    if (command.target.kind !== "object") {
      return this.unhandled(command);
    }
    const key = command.target.key;
    if (!isCarried(contextOf(this.world), key)) {
      return [say(messages["16"] ?? "Check your Inventory!")];
    }
    this.world.objects[key] = this.world.room;
    return [say(messages["12"] ?? "OK.")];
  }

  /** The original picks one of messages 13/14/15 at random (line 8309). */
  private fallbackMessage(): string {
    const index = randomInt(this.world, FALLBACK_MESSAGES.length);
    const number = FALLBACK_MESSAGES[index]!;
    return messages[String(number)] ?? "Try something else............";
  }
}

/** Convenience for tests and the console: does this world satisfy a condition? */
export function check(world: World, conditions: Parameters<typeof evaluateAll>[1]) {
  return evaluateAll(contextOf(world), conditions);
}

export { CARRY_LIMIT };
