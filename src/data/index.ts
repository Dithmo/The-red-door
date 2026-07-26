/**
 * Loads and validates the generated game data.
 *
 * The validation here is not defensive paranoia -- it is how a bad transcription
 * gets caught. tools/build_gamedata.py can only check what it produces; these
 * checks verify the data is internally consistent as a *game* (every exit leads
 * somewhere, every object is reachable, no duplicate keys).
 */

import roomsJson from "./rooms.json";
import objectsJson from "./objects.json";
import lexiconJson from "./lexicon.json";
import messagesJson from "./messages.json";
import flagsJson from "./flags.json";

import type { Direction, GameObject, Lexicon, Room } from "./types";
import { CARRIED, NOWHERE } from "./types";

export const rooms = roomsJson as unknown as Room[];
export const objects = objectsJson as unknown as GameObject[];
export const lexicon = lexiconJson as unknown as Lexicon;
export const messages = messagesJson as Record<string, string>;
/** Original flag offset -> name, from docs/GAME-DATA.md §6. */
export const flagNames = flagsJson as Record<string, string>;

export const roomById = new Map(rooms.map((r) => [r.id, r]));
export const roomByKey = new Map(rooms.map((r) => [r.key, r]));
export const objectById = new Map(objects.map((o) => [o.id, o]));
export const objectByKey = new Map(objects.map((o) => [o.key, o]));

export const DIRECTIONS: Direction[] = [
  "north",
  "south",
  "east",
  "west",
  "up",
  "down",
];

/** Objects the original defines but never uses; see docs/GAME-DATA.md §4. */
export const DEAD_CONTENT = {
  objects: [28, 29, 30],
  note:
    "Objects 28-30 are placeholders named no28/no29/no30. They are excluded " +
    "from the remake, so the gap in object numbering is intentional. Note that " +
    "room 31 is NOT dead content -- it is the snake-pit death, reached by going " +
    "DOWN from room 14.",
} as const;

/**
 * Check the data is self-consistent. Returns problems rather than throwing so
 * callers can decide -- the dev server warns, the test suite fails.
 */
export function validate(): string[] {
  const problems: string[] = [];

  const seenRoomKeys = new Set<string>();
  for (const room of rooms) {
    if (seenRoomKeys.has(room.key)) problems.push(`duplicate room key: ${room.key}`);
    seenRoomKeys.add(room.key);

    if (!room.description.trim()) problems.push(`room ${room.id} has no description`);
    if (room.ink < 0 || room.ink > 7) problems.push(`room ${room.id} ink out of range: ${room.ink}`);
    if (room.images.length === 0) problems.push(`room ${room.id} has no image slot`);

    // the last image slot must be unconditional, or some states render nothing
    const fallback = room.images.at(-1);
    if (fallback && fallback.when) {
      problems.push(`room ${room.id} has no unconditional fallback image`);
    }

    for (const [dir, target] of Object.entries(room.exits)) {
      if (!roomById.has(target as number)) {
        problems.push(`room ${room.id} exit ${dir} -> ${target}, which does not exist`);
      }
    }

    // A fatal room has no exits by definition -- if it had one, the player would
    // never live to use it, which would mean the transcription misread something.
    if (room.fatal && Object.keys(room.exits).length > 0) {
      problems.push(`room ${room.id} is fatal but has exits`);
    }
  }

  const seenObjKeys = new Set<string>();
  for (const obj of objects) {
    if (seenObjKeys.has(obj.key)) problems.push(`duplicate object key: ${obj.key}`);
    seenObjKeys.add(obj.key);

    if (!obj.noun) problems.push(`object ${obj.id} has no noun`);
    if (
      obj.startsAt !== NOWHERE &&
      obj.startsAt !== CARRIED &&
      !roomById.has(obj.startsAt)
    ) {
      problems.push(`object ${obj.id} starts in room ${obj.startsAt}, which does not exist`);
    }
  }

  // Objects sharing a noun must be separable by adjective, or the player can
  // never say which one they mean. This is the bronze/gold TOKEN problem.
  const byNoun = new Map<string, GameObject[]>();
  for (const obj of objects) {
    const list = byNoun.get(obj.noun) ?? [];
    list.push(obj);
    byNoun.set(obj.noun, list);
  }
  for (const [noun, group] of byNoun) {
    if (group.length < 2) continue;
    for (const obj of group) {
      const others = group.filter((o) => o.key !== obj.key);
      const unique = obj.adjectives.filter(
        (adj) => !others.some((o) => o.adjectives.includes(adj)),
      );
      if (unique.length === 0) {
        problems.push(
          `object ${obj.id} (${obj.key}) shares the noun "${noun}" with ` +
            `${others.map((o) => o.key).join(", ")} but has no distinguishing adjective`,
        );
      }
    }
  }

  for (const flagName of Object.values(flagNames)) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(flagName)) {
      problems.push(`flag name is not a valid identifier: ${flagName}`);
    }
  }

  return problems;
}
