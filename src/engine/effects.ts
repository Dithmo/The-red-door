/**
 * Effect application.
 *
 * Each variant corresponds to a POKE (or small group of POKEs) in the original.
 * Effects are applied in order and mutate the world in place -- callers snapshot
 * beforehand if they want undo.
 */

import type { Effect } from "../data/types";
import type { World } from "./world";
import {
  addFlag,
  destroyObject,
  dropObject,
  moveObject,
  setFlag,
  takeObject,
} from "./world";

export function applyEffect(world: World, effect: Effect): void {
  if ("take" in effect) {
    takeObject(world, effect.take);
    return;
  }
  if ("drop" in effect) {
    dropObject(world, effect.drop);
    return;
  }
  if ("destroy" in effect) {
    destroyObject(world, effect.destroy);
    return;
  }
  if ("moveTo" in effect) {
    moveObject(
      world,
      effect.moveTo,
      effect.room === "here" ? world.room : effect.room,
    );
    return;
  }
  if ("transform" in effect) {
    const where = world.objects[effect.transform];
    if (where === undefined) {
      throw new Error(`unknown object key: ${effect.transform}`);
    }
    moveObject(world, effect.into, where);
    destroyObject(world, effect.transform);
    return;
  }
  if ("flag" in effect) {
    if ("set" in effect) setFlag(world, effect.flag, effect.set);
    else addFlag(world, effect.flag, effect.add);
    return;
  }
  if ("teleport" in effect) {
    world.room = effect.teleport;
    return;
  }
  if ("end" in effect) {
    world.ended = { outcome: effect.end };
    return;
  }
  const unreachable: never = effect;
  throw new Error(`unknown effect: ${JSON.stringify(unreachable)}`);
}

export function applyEffects(
  world: World,
  effects: readonly Effect[] | undefined,
): void {
  for (const effect of effects ?? []) applyEffect(world, effect);
}

/** Object keys an effect list touches -- used to validate rules against data. */
export function effectTargets(effects: readonly Effect[] | undefined): string[] {
  const keys: string[] = [];
  for (const effect of effects ?? []) {
    if ("take" in effect) keys.push(effect.take);
    else if ("drop" in effect) keys.push(effect.drop);
    else if ("destroy" in effect) keys.push(effect.destroy);
    else if ("moveTo" in effect) keys.push(effect.moveTo);
    else if ("transform" in effect) keys.push(effect.transform, effect.into);
  }
  return keys;
}
