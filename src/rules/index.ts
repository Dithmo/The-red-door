/**
 * The rule table.
 *
 * Unlike everything under src/data/, this file is hand-authored -- the original
 * encodes its puzzle logic in control flow, not in a table, so it has to be
 * transcribed rather than extracted. Every rule carries an `origin` naming the
 * BASIC line it came from, and `validateRules` checks those references, so the
 * transcription is auditable rather than trusted.
 *
 * Transcription is incomplete: this is the vertical slice from phase 2 (movement
 * guards, the mummy-case sequence, the snake and basket). Phase 4 fills in the
 * remaining ~310 clauses.
 */

import rulesJson from "./rules.json";

import { flagNames, lexicon, messages, objectByKey, roomById } from "../data/index";
import type { Condition, Effect, Rule } from "../data/types";
import { effectTargets } from "../engine/effects";
import { ARRIVAL_VERB } from "../engine/game";
import { candidatesFor } from "../engine/rules";

export const rules = rulesJson as unknown as Rule[];

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
    if (rule.verb !== "*" && rule.verb !== ARRIVAL_VERB && !knownVerbs.has(rule.verb)) {
      problems.push(`${at}: unknown verb "${rule.verb}"`);
    }
    if (!rule.then && !rule.say) {
      problems.push(`${at}: does nothing -- no effects and nothing to say`);
    }

    // targets
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

    // referenced objects, flags, rooms, messages
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
    for (const entry of rule.say ?? []) {
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
      if (earlier.verb !== later.verb && earlier.verb !== "*") continue;

      // Do they compete for the same commands?
      const overlaps = targetsOverlap(earlier, later);
      if (!overlaps) continue;

      // If everything the earlier rule requires is also required by the later
      // one, the earlier always wins and the later is dead.
      const earlierConds = (earlier.when ?? []).map((c) => JSON.stringify(c));
      const weaker = earlierConds.every((c) => laterConds.has(c));
      if (weaker) {
        problems.push(
          `rule ${later.id} is unreachable: ${earlier.id} (${earlier.origin}) ` +
            `matches the same commands with weaker conditions`,
        );
      }
    }
  }
  return problems;
}

function targetsOverlap(a: Rule, b: Rule): boolean {
  const at = a.target;
  const bt = b.target;
  if (!at || !bt) return true;
  if ("any" in at || "any" in bt) return true;
  if ("none" in at) return "none" in bt;
  if ("object" in at && "object" in bt) {
    const as = new Set(Array.isArray(at.object) ? at.object : [at.object]);
    const bs = Array.isArray(bt.object) ? bt.object : [bt.object];
    return bs.some((k) => as.has(k));
  }
  if ("scenery" in at && "scenery" in bt) {
    const as = new Set(Array.isArray(at.scenery) ? at.scenery : [at.scenery]);
    const bs = Array.isArray(bt.scenery) ? bt.scenery : [bt.scenery];
    return bs.some((c) => as.has(c));
  }
  if ("direction" in at && "direction" in bt) {
    return at.direction === bt.direction;
  }
  return false;
}

/** Which BASIC lines have been transcribed so far -- phase 4 progress. */
export function transcribedLines(ruleset: readonly Rule[] = rules): number[] {
  const lines = new Set<number>();
  for (const rule of ruleset) {
    const match = /^red\.bas:(\d+)$/.exec(rule.origin);
    if (match) lines.add(Number(match[1]));
  }
  return [...lines].sort((a, b) => a - b);
}

/** Sanity: no rule should be aimed at a verb/target the parser can't produce. */
export { candidatesFor };
