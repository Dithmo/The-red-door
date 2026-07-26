/**
 * Rule matching.
 *
 * Rules are ordered and the first match wins. That is not laziness -- it is what
 * the original does. Sinclair BASIC falls through to the next higher line number
 * when a GO TO target does not exist, and the game leans on it: garden rooms
 * 24-27 all land on one description routine, and PULL silently behaves as PUSH
 * because line 4700 was never written. Preserving order preserves behaviour.
 */

import type {
  Command,
  CommandTarget,
  Condition,
  Rule,
  RuleTarget,
} from "../data/types";
import type { ConditionContext } from "./conditions";
import { evaluateAll } from "./conditions";

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/** Does the command's noun satisfy what the rule is looking for? */
export function targetMatches(
  target: RuleTarget | undefined,
  actual: CommandTarget,
): boolean {
  // A rule with no target clause accepts whatever the player aimed at.
  if (!target) return true;

  if ("any" in target) return true;
  if ("none" in target) return actual.kind === "none";
  if ("anyObject" in target) return actual.kind === "object";
  if ("anyScenery" in target) return actual.kind === "scenery";
  if ("object" in target) {
    return (
      actual.kind === "object" && asArray(target.object).includes(actual.key)
    );
  }
  if ("scenery" in target) {
    return (
      actual.kind === "scenery" && asArray(target.scenery).includes(actual.code)
    );
  }
  if ("direction" in target) {
    return (
      actual.kind === "direction" && actual.direction === target.direction
    );
  }
  const unreachable: never = target;
  throw new Error(`unknown rule target: ${JSON.stringify(unreachable)}`);
}

export function ruleApplies(
  rule: Rule,
  command: Command,
  ctx: ConditionContext,
): boolean {
  if (rule.verb !== "*" && rule.verb !== command.verb) return false;
  if (!targetMatches(rule.target, command.target)) return false;
  // `targetCarried` / `targetPresent` need to know what the command named.
  return evaluateAll({ ...ctx, target: command.target }, rule.when);
}

/** The first rule that applies, or undefined to fall through to a default. */
export function findRule(
  ruleset: readonly Rule[],
  command: Command,
  ctx: ConditionContext,
): Rule | undefined {
  return ruleset.find((rule) => ruleApplies(rule, command, ctx));
}

/**
 * Every rule that could ever fire for this verb/target pair, ignoring state.
 * Used by the validator to find rules permanently shadowed by an earlier one --
 * a transcription mistake that would otherwise be invisible.
 */
export function candidatesFor(
  ruleset: readonly Rule[],
  verb: string,
  target: CommandTarget,
): Rule[] {
  return ruleset.filter(
    (rule) =>
      (rule.verb === "*" || rule.verb === verb) &&
      targetMatches(rule.target, target),
  );
}

/** Flags a rule reads, for cross-checking against the known flag list. */
export function flagsRead(rule: Rule): string[] {
  return (rule.when ?? [])
    .filter((c: Condition): c is Extract<Condition, { flag: string }> =>
      "flag" in c,
    )
    .map((c) => c.flag);
}

/** Flags a rule writes. */
export function flagsWritten(rule: Rule): string[] {
  return (rule.then ?? [])
    .filter((e): e is Extract<typeof e, { flag: string }> => "flag" in e)
    .map((e) => e.flag);
}
