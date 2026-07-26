/**
 * Turning a room plus world state into the text and picture the player sees.
 *
 * The original builds a description by printing a base block and then appending
 * conditional lines (e.g. whether the spider is still spinning). Variants replace
 * the whole block; fragments append to it. See docs/GAME-DATA.md §3.
 */

import type { ConditionContext } from "./conditions";
import { evaluateAll } from "./conditions";
import type { ImageSlot, Room } from "../data/types";

/** ZX Spectrum BRIGHT palette -- the tape runs with BRIGHT 1 throughout. */
export const SPECTRUM_PALETTE = [
  "#000000",
  "#0000ff",
  "#ff0000",
  "#ff00ff",
  "#00ff00",
  "#00ffff",
  "#ffff00",
  "#ffffff",
] as const;

export function inkColour(ink: number): string {
  return SPECTRUM_PALETTE[ink] ?? SPECTRUM_PALETTE[7];
}

/**
 * The full description of a room in its current state: the base text (or a
 * matching variant instead) followed by any matching fragments.
 */
export function describeRoom(room: Room, ctx: ConditionContext): string {
  const variant = room.descriptionVariants?.find((v) =>
    evaluateAll(ctx, v.when),
  );
  const parts = [variant ? variant.text : room.description];

  for (const fragment of room.descriptionFragments ?? []) {
    if (evaluateAll(ctx, fragment.when)) parts.push(fragment.text);
  }

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * The picture for a room in its current state. Slots are ordered most-specific
 * first, and the last one is unconditional (enforced by data validation), so
 * this always resolves.
 */
export function resolveImage(room: Room, ctx: ConditionContext): ImageSlot {
  const match = room.images.find((slot) => evaluateAll(ctx, slot.when));
  // The validator guarantees a trailing unconditional slot, so `match` is set;
  // fall back to the last slot rather than throwing if data is being edited.
  return match ?? room.images[room.images.length - 1]!;
}

/** Exits, in the original's table order, for a status line or compass. */
export function availableExits(room: Room): string[] {
  return Object.entries(room.exits)
    .filter(([, target]) => Boolean(target))
    .map(([dir]) => dir);
}

/**
 * A sentence naming the ways out.
 *
 * The original never printed one. Its room descriptions mention exits only when
 * the prose happens to ("a long dark corridor stretching to the west"), and
 * several rooms mention none at all, which leaves the player guessing between
 * six directions. Saying it plainly costs nothing and removes a whole class of
 * wasted turns.
 *
 * It lists what the exit table holds, so it stays honest about rooms where a
 * rule then refuses to let you through -- room 1's west is listed, and the game
 * explains why when you try it. Exits a rule *creates* are not listed, because
 * the table does not know about them: the silver doors out of the entrance hall
 * are the Anubis's business, not a direction.
 */
export function exitsSentence(room: Room): string {
  const exits = availableExits(room);
  if (exits.length === 0) return "There is no way on that you can see.";
  if (exits.length === 1) return `You can go ${exits[0]}.`;
  const last = exits[exits.length - 1];
  return `You can go ${exits.slice(0, -1).join(", ")} or ${last}.`;
}
