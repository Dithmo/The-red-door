/**
 * Shapes of the generated game data.
 *
 * Every file under src/data/*.json is produced by tools/build_gamedata.py from
 * the reverse-engineered tape -- do not hand-edit them. Run `npm run data` to
 * regenerate. See docs/GAME-DATA.md for what each field means in the original.
 */

/** Sentinel used in the object-location table, inherited from the original. */
export const CARRIED = 99;
/** An object that is not in play yet (or has been consumed). */
export const NOWHERE = 0;
/** Carrying limit -- `max` in the tape's saved variables. Load-bearing. */
export const CARRY_LIMIT = 6;

export type Direction = "north" | "south" | "east" | "west" | "up" | "down";

/**
 * A single test against world state. Conditions are ANDed within a list.
 * Deliberately small -- the whole original expresses in these five forms.
 */
export type Condition =
  | { room: number }
  | { flag: string; eq: number }
  | { flag: string; lt: number }
  | { flag: string; gte: number }
  | { carrying: string }
  | { present: string }
  | { objectAt: string; room: number };

/** Text shown only while a condition holds. */
export interface ConditionalText {
  text: string;
  when: Condition[];
  /** Back-reference to the BASIC line this was transcribed from. */
  origin: string;
}

/** One candidate picture for a room; first whose `when` matches is used. */
export interface ImageSlot {
  src: string;
  when?: Condition[];
}

/** A room whose description routine ends the game instead of returning. */
export interface FatalRoom {
  text: string;
  origin: string;
}

export interface Room {
  id: number;
  key: string;
  name: string;
  /** Original ZX Spectrum ink colour, 0-7. Drives the accent colour. */
  ink: number;
  description: string;
  /** Present iff entering the room kills the player (room 31, the snake pit). */
  fatal?: FatalRoom;
  /** Replaces `description` entirely when matched (first match wins). */
  descriptionVariants?: ConditionalText[];
  /** Appended to the description when matched. */
  descriptionFragments?: ConditionalText[];
  exits: Partial<Record<Direction, number>>;
  images: ImageSlot[];
  origin: string;
}

export interface GameObject {
  id: number;
  key: string;
  /** The head noun the player types. */
  noun: string;
  /** Distinguishing words -- essential for the bronze/gold TOKEN class of pair. */
  adjectives: string[];
  description: string;
  /** Room id, or CARRIED, or NOWHERE. */
  startsAt: number;
}

export interface VerbSpec {
  name: string;
  /** The original's verb code, for cross-checking against docs/GAME-DATA.md §5. */
  originalCode: number;
  /** Grammar patterns, e.g. "V N with N". `N` is a noun phrase. */
  patterns: string[];
  /** Every surface form that maps to this verb. */
  words: string[];
}

export interface DirectionSpec {
  name: Direction;
  words: string[];
}

export interface ScenerySpec {
  /** The original's noun code; scenery responses are keyed on this. */
  code: number;
  words: string[];
}

export interface Lexicon {
  verbs: VerbSpec[];
  directions: DirectionSpec[];
  scenery: ScenerySpec[];
  noiseWords: string[];
  prepositions: string[];
  pronouns: Record<string, string | null>;
  note: string;
}
