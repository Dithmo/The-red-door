/**
 * The rule table.
 *
 * Unlike everything under src/data/, these files are hand-authored: the original
 * encodes its puzzle logic in control flow, not in a table, so it has to be
 * transcribed rather than extracted. Every rule carries an `origin` naming the
 * BASIC line it came from, and `validateRules` checks those references, so the
 * transcription is auditable rather than trusted.
 *
 * ORDER MATTERS. Rules are matched first-match-wins, reproducing BASIC's line
 * fall-through, which the original relies on. Within a file, specific cases come
 * before general ones; across files the order below mirrors the original's own
 * dispatch order. `findShadowedRules` catches rules a broader earlier one has
 * made unreachable.
 */

import arrivalsJson from "./arrivals.json";
import coreJson from "./core.json";
import puzzlesJson from "./puzzles.json";
import responsesJson from "./responses.json";
import sceneryJson from "./scenery.json";

import { flagNames, lexicon, messages, objectByKey, roomById } from "../data/index";
import type { Condition, Effect, Rule, RuleTarget } from "../data/types";
import { effectTargets } from "../engine/effects";
import { ARRIVAL_VERB } from "../engine/game";
import { candidatesFor, verbMatches } from "../engine/rules";

/**
 * `core` first: it holds the guards the original checks before anything else
 * (movement blocks, the mummy case). `scenery` last: its per-room responses are
 * the original's fall-through, reached only when nothing more specific matched.
 */
export const rules: Rule[] = [
  ...(coreJson as unknown as Rule[]),
  ...(puzzlesJson as unknown as Rule[]),
  ...(responsesJson as unknown as Rule[]),
  ...(sceneryJson as unknown as Rule[]),
  ...(arrivalsJson as unknown as Rule[]),
];

/** Object keys a condition list mentions. */
function conditionObjects(conditions: readonly Condition[] | undefined): string[] {
  const keys: string[] = [];
  for (const condition of conditions ?? []) {
    if ("not" in condition) keys.push(...conditionObjects([condition.not]));
    else if ("carrying" in condition) keys.push(condition.carrying);
    else if ("present" in condition) keys.push(condition.present);
    else if ("objectAt" in condition) keys.push(condition.objectAt);
  }
  return keys;
}

function conditionFlags(conditions: readonly Condition[] | undefined): string[] {
  const names: string[] = [];
  for (const condition of conditions ?? []) {
    if ("not" in condition) names.push(...conditionFlags([condition.not]));
    else if ("flag" in condition) names.push(condition.flag);
  }
  return names;
}

function conditionRooms(conditions: readonly Condition[] | undefined): number[] {
  const ids: number[] = [];
  for (const condition of conditions ?? []) {
    if ("not" in condition) ids.push(...conditionRooms([condition.not]));
    else if ("objectAt" in condition) ids.push(condition.room);
    else if ("room" in condition) ids.push(condition.room);
  }
  return ids;
}

function effectFlags(effects: readonly Effect[] | undefined): string[] {
  return (effects ?? [])
    .filter((e): e is Extract<Effect, { flag: string }> => "flag" in e)
    .map((e) => e.flag);
}

function effectRooms(effects: readonly Effect[] | undefined): number[] {
  const ids: number[] = [];
  for (const effect of effects ?? []) {
    if ("teleport" in effect) ids.push(effect.teleport);
    else if ("moveTo" in effect && typeof effect.room === "number") {
      ids.push(effect.room);
    }
  }
  return ids;
}

const ORIGIN = /^red\.bas:\d+$/;

/**
 * Check the rule table against the generated data and against itself. Returns
 * problems rather than throwing, so the test suite can report them all at once.
 */
export function validateRules(ruleset: readonly Rule[] = rules): string[] {
  const problems: string[] = [];
  const knownVerbs = new Set(lexicon.verbs.map((v) => v.name));
  const knownScenery = new Set(lexicon.scenery.map((s) => s.code));
  const knownFlags = new Set(Object.values(flagNames));
  const seenIds = new Set<string>();

  for (const rule of ruleset) {
    const at = `rule ${rule.id}`;

    if (seenIds.has(rule.id)) problems.push(`duplicate rule id: ${rule.id}`);
    seenIds.add(rule.id);

    if (!ORIGIN.test(rule.origin)) {
      problems.push(`${at}: origin "${rule.origin}" is not of the form red.bas:NNNN`);
    }
    for (const verb of Array.isArray(rule.verb) ? rule.verb : [rule.verb]) {
      if (verb !== "*" && verb !== ARRIVAL_VERB && !knownVerbs.has(verb)) {
        problems.push(`${at}: unknown verb "${verb}"`);
      }
    }
    if (!rule.then && !rule.say && !rule.sayRandom) {
      problems.push(`${at}: does nothing -- no effects and nothing to say`);
    }

    const target = rule.target;
    if (target && "object" in target) {
      const keys = Array.isArray(target.object) ? target.object : [target.object];
      for (const key of keys) {
        if (!objectByKey.has(key)) {
          problems.push(`${at}: targets unknown object "${key}"`);
        }
      }
    }
    if (target && "scenery" in target) {
      const codes = Array.isArray(target.scenery)
        ? target.scenery
        : [target.scenery];
      for (const code of codes) {
        if (!knownScenery.has(code)) {
          problems.push(`${at}: targets unknown scenery code ${code}`);
        }
      }
    }

    for (const key of [
      ...conditionObjects(rule.when),
      ...effectTargets(rule.then),
    ]) {
      if (!objectByKey.has(key)) {
        problems.push(`${at}: references unknown object "${key}"`);
      }
    }
    for (const flag of [...conditionFlags(rule.when), ...effectFlags(rule.then)]) {
      if (!knownFlags.has(flag)) {
        problems.push(`${at}: references unknown flag "${flag}"`);
      }
    }
    for (const room of [...conditionRooms(rule.when), ...effectRooms(rule.then)]) {
      if (!roomById.has(room)) {
        problems.push(`${at}: references unknown room ${room}`);
      }
    }
    for (const entry of [
      ...(rule.say ?? []),
      ...(rule.sayRandom ?? []).flat(),
    ]) {
      if (typeof entry !== "string" && !(String(entry.message) in messages)) {
        problems.push(`${at}: references unknown message ${entry.message}`);
      }
    }
  }

  problems.push(...findShadowedRules(ruleset));
  return problems;
}

/**
 * Rules that can never fire because an earlier rule with the same verb and an
 * overlapping target has strictly weaker conditions. This is the failure mode
 * transcription is most prone to -- a specific case written after the general
 * one -- and it is invisible without a check like this.
 */
export function findShadowedRules(ruleset: readonly Rule[]): string[] {
  const problems: string[] = [];

  for (let i = 0; i < ruleset.length; i += 1) {
    const later = ruleset[i]!;
    const laterConds = new Set((later.when ?? []).map((c) => JSON.stringify(c)));

    for (let j = 0; j < i; j += 1) {
      const earlier = ruleset[j]!;
      // The earlier rule only shadows the later one if it answers to every verb
      // the later one does.
      const laterVerbs = Array.isArray(later.verb) ? later.verb : [later.verb];
      if (!laterVerbs.every((v) => verbMatches(earlier.verb, v))) continue;
      // Coverage, not mere overlap: the earlier rule only makes the later one
      // dead if it catches *everything* the later one would. Partial overlap just
      // means some commands go to the earlier rule -- which the original does too
      // (EXAMINE BUSH reaches the mulberry line before the silkworm line, exactly
      // as it does on the tape).
      if (!targetCovers(earlier.target, later.target)) continue;

      const earlierConds = (earlier.when ?? []).map((c) => JSON.stringify(c));
      if (earlierConds.every((c) => laterConds.has(c))) {
        problems.push(
          `rule ${later.id} is unreachable: ${earlier.id} (${earlier.origin}) ` +
            `matches the same commands with weaker conditions`,
        );
      }
    }
  }
  return problems;
}

/** True when everything `later` would match, `earlier` matches too. */
export function targetCovers(
  earlier: RuleTarget | undefined,
  later: RuleTarget | undefined,
): boolean {
  // No target clause accepts anything, so it covers everything.
  if (!earlier) return true;
  if ("any" in earlier) return true;
  if (!later) return false; // later accepts more than earlier can
  if ("any" in later) return false;

  if ("anyObject" in earlier) return "anyObject" in later || "object" in later;
  if ("anyScenery" in earlier) return "anyScenery" in later || "scenery" in later;
  if ("none" in earlier) return "none" in later;

  if ("object" in earlier) {
    if (!("object" in later)) return false;
    const wide = new Set(
      Array.isArray(earlier.object) ? earlier.object : [earlier.object],
    );
    const narrow = Array.isArray(later.object) ? later.object : [later.object];
    return narrow.every((k) => wide.has(k));
  }
  if ("scenery" in earlier) {
    if (!("scenery" in later)) return false;
    const wide = new Set(
      Array.isArray(earlier.scenery) ? earlier.scenery : [earlier.scenery],
    );
    const narrow = Array.isArray(later.scenery)
      ? later.scenery
      : [later.scenery];
    return narrow.every((c) => wide.has(c));
  }
  if ("direction" in earlier) {
    return "direction" in later && earlier.direction === later.direction;
  }
  return false;
}

/** Which BASIC lines have been transcribed so far. */
export function transcribedLines(ruleset: readonly Rule[] = rules): number[] {
  const lines = new Set<number>();
  for (const rule of ruleset) {
    const match = /^red\.bas:(\d+)$/.exec(rule.origin);
    if (match) lines.add(Number(match[1]));
  }
  return [...lines].sort((a, b) => a - b);
}

export { candidatesFor };
