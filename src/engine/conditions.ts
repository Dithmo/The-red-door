/**
 * Condition evaluation.
 *
 * The original expresses every test as a comparison against one of two byte
 * arrays -- the flag array at 64280 and the object-location array at 64379.
 * These five forms cover all 337 conditional clauses in the tape; see
 * docs/GAME-DATA.md §6 for the flag meanings.
 */

import type { Condition } from "../data/types";
import { CARRIED } from "../data/types";

/** The slice of world state a condition can see. */
export interface ConditionContext {
  room: number;
  flags: Readonly<Record<string, number>>;
  /** object key -> room id, or CARRIED, or NOWHERE */
  objects: Readonly<Record<string, number>>;
}

export function flagValue(ctx: ConditionContext, name: string): number {
  return ctx.flags[name] ?? 0;
}

export function objectLocation(ctx: ConditionContext, key: string): number {
  return ctx.objects[key] ?? 0;
}

export function isCarried(ctx: ConditionContext, key: string): boolean {
  return objectLocation(ctx, key) === CARRIED;
}

/**
 * True if the object is here to be interacted with -- either held or lying in
 * the current room. The original checks `PEEK (o+n) = m OR PEEK (o+n) = PEEK f`.
 */
export function isPresent(ctx: ConditionContext, key: string): boolean {
  const where = objectLocation(ctx, key);
  return where === CARRIED || where === ctx.room;
}

export function evaluate(ctx: ConditionContext, condition: Condition): boolean {
  if ("not" in condition) return !evaluate(ctx, condition.not);
  if ("room" in condition && !("objectAt" in condition)) {
    return ctx.room === condition.room;
  }
  if ("flag" in condition) {
    const value = flagValue(ctx, condition.flag);
    if ("eq" in condition) return value === condition.eq;
    if ("lt" in condition) return value < condition.lt;
    if ("gte" in condition) return value >= condition.gte;
    return false;
  }
  if ("carrying" in condition) return isCarried(ctx, condition.carrying);
  if ("present" in condition) return isPresent(ctx, condition.present);
  if ("objectAt" in condition) {
    return objectLocation(ctx, condition.objectAt) === condition.room;
  }
  // Exhaustive over Condition; a new variant must be handled explicitly rather
  // than silently passing.
  const unreachable: never = condition;
  throw new Error(`unknown condition: ${JSON.stringify(unreachable)}`);
}

/** Conditions in a list are ANDed, matching the original's `AND` chains. */
export function evaluateAll(
  ctx: ConditionContext,
  conditions: readonly Condition[] | undefined,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluate(ctx, c));
}
