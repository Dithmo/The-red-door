/**
 * World state.
 *
 * Mirrors the original's two byte arrays -- flags at 64280 and object locations
 * at 64379 -- but keyed by name instead of offset. See docs/GAME-DATA.md §6.
 *
 * One deliberate departure: the original maintains a carried-item *counter* by
 * hand (o+0, incremented and decremented by the routines at 8800/8805, and
 * adjusted in bulk when a mummy takes four items at once). We derive the count
 * from the object table instead, so it cannot drift out of step with reality.
 */

import { objects, rooms } from "../data/index";
import type { GameObject } from "../data/types";
import { CARRIED, CARRY_LIMIT, NOWHERE } from "../data/types";
import type { ConditionContext } from "./conditions";

export interface World {
  room: number;
  flags: Record<string, number>;
  /** object key -> room id, or CARRIED, or NOWHERE */
  objects: Record<string, number>;
  turn: number;
  /** Set once the game is over; no further commands are accepted. */
  ended?: { outcome: "win" | "lose" };
  /**
   * Seed for the original's random flourishes (the three-way "I don't
   * understand" and the random mummy chatter). Kept in the world so saves and
   * tests reproduce exactly.
   */
  seed: number;
}

export const STARTING_ROOM = 1;

export function createWorld(seed = 0x1d0d): World {
  const objectLocations: Record<string, number> = {};
  for (const obj of objects) objectLocations[obj.key] = obj.startsAt;

  return {
    room: STARTING_ROOM,
    // The original's flags all start at 0 except f+5, set by BASIC line 9985.
    flags: { poolUndrawn: 1 },
    objects: objectLocations,
    turn: 0,
    seed,
  };
}

export function cloneWorld(world: World): World {
  return {
    room: world.room,
    flags: { ...world.flags },
    objects: { ...world.objects },
    turn: world.turn,
    ...(world.ended ? { ended: { ...world.ended } } : {}),
    seed: world.seed,
  };
}

/** A world doubles as a ConditionContext -- the fields line up by design. */
export function contextOf(world: World): ConditionContext {
  return { room: world.room, flags: world.flags, objects: world.objects };
}

/* ---------------------------------------------------------------- queries -- */

export function carriedKeys(world: World): string[] {
  return Object.entries(world.objects)
    .filter(([, where]) => where === CARRIED)
    .map(([key]) => key);
}

export function carriedCount(world: World): number {
  return carriedKeys(world).length;
}

export function isFull(world: World): boolean {
  return carriedCount(world) >= CARRY_LIMIT;
}

/** Objects lying loose in the current room. */
export function objectsHere(world: World): GameObject[] {
  return objects.filter((o) => world.objects[o.key] === world.room);
}

/** Objects the player can refer to: held, or lying here. */
export function reachable(world: World): GameObject[] {
  return objects.filter((o) => {
    const where = world.objects[o.key];
    return where === CARRIED || where === world.room;
  });
}

export function currentRoom(world: World) {
  const room = rooms.find((r) => r.id === world.room);
  if (!room) throw new Error(`world is in unknown room ${world.room}`);
  return room;
}

/* --------------------------------------------------------------- mutation -- */

export function setFlag(world: World, name: string, value: number): void {
  world.flags[name] = value;
}

export function addFlag(world: World, name: string, delta: number): void {
  world.flags[name] = (world.flags[name] ?? 0) + delta;
}

export function moveObject(world: World, key: string, where: number): void {
  if (!(key in world.objects)) {
    throw new Error(`unknown object key: ${key}`);
  }
  world.objects[key] = where;
}

export function takeObject(world: World, key: string): void {
  moveObject(world, key, CARRIED);
}

export function dropObject(world: World, key: string): void {
  moveObject(world, key, world.room);
}

export function destroyObject(world: World, key: string): void {
  moveObject(world, key, NOWHERE);
}

/**
 * A small deterministic PRNG (mulberry32). The original calls RANDOMIZE and RND;
 * we need the same flavour of unpredictability but reproducible, so a failing
 * test can be re-run and a saved game resumes identically.
 */
export function nextRandom(world: World): number {
  world.seed = (world.seed + 0x6d2b79f5) | 0;
  let t = world.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomInt(world: World, count: number): number {
  return Math.floor(nextRandom(world) * count);
}
