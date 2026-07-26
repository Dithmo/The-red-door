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
  | { objectAt: string; room: number }
  /**
   * "the object the player named is being carried" -- the original's
   * `PEEK (o+no)=m`, which guards nearly every verb handler. Needed because a
   * rule targeting several objects cannot name which one the command referred to.
   */
  | { targetCarried: true }
  /** As above, but held or lying in this room. */
  | { targetPresent: true }
  /**
   * Negation. The original is full of `<>` tests -- `PEEK (o+no)<>m` ("you
   * haven't got it") is the single most common guard in the listing -- so
   * transcribing them directly beats contorting rule order to fake it.
   */
  | { not: Condition };

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

/* -------------------------------------------------------------------------- *
 * Rules
 *
 * The original is 337 clauses of the form
 *   IF room/noun/flag THEN set-flags, move-objects, print-text
 * so a rule is exactly that: a verb, what it was aimed at, the state it needs,
 * the state it changes, and what it prints. Rules are ordered and the FIRST
 * match wins -- this reproduces BASIC's line fall-through, which the original
 * genuinely relies on (see docs/GAME-DATA.md §1).
 * -------------------------------------------------------------------------- */

/** What the player's noun has to refer to for a rule to apply. */
export type RuleTarget =
  /** One of these object keys. */
  | { object: string | string[] }
  /** One of these scenery noun codes from the original's table. */
  | { scenery: number | number[] }
  | { direction: Direction }
  /** The verb was used bare, with no noun. */
  | { none: true }
  /**
   * Any real object (1-35). The original tests `IF no>35` to split objects from
   * scenery, so a catch-all in a verb handler applies to one group or the other,
   * never both.
   */
  | { anyObject: true }
  /** Any scenery noun (>35). */
  | { anyScenery: true }
  /** Any noun, or none. */
  | { any: true };

/** A change to world state. These cover every POKE in the original. */
export type Effect =
  | { take: string }
  | { drop: string }
  /** Remove from play entirely -- the original pokes the location to 0. */
  | { destroy: string }
  | { moveTo: string; room: number | "here" }
  /**
   * Replace one object with another *in place*, wherever it happens to be:
   * `POKE (o+new),(PEEK (o+old)): POKE (o+old),0`. The original does this for all
   * five transformation pairs (bronze/gold token, plain/threaded needle,
   * whole/shaped cloth, empty/full jug, empty/snake basket), and "in place"
   * matters -- WAVE ROD converts the token whether you are holding it or not.
   */
  | { transform: string; into: string }
  | { flag: string; set: number }
  | { flag: string; add: number }
  | { teleport: number }
  | { end: "win" | "lose" };

/** A line of output: literal text, or one of the original's numbered messages. */
export type Say = string | { message: number };

export interface Rule {
  id: string;
  /**
   * Canonical verb name, several of them, or "*" for any.
   *
   * A list is how one action accepts the several ways a player might phrase it.
   * The original does this by redirection -- BLOW jumps to the PLAY handler,
   * CATCH to TAKE -- and the same idea is what stops a puzzle turning into
   * guess-the-verb.
   */
  verb: string | string[];
  target?: RuleTarget;
  /** ANDed. Omitted means "always". */
  when?: Condition[];
  then?: Effect[];
  say?: Say[];
  /**
   * Pick one group at random and say it. The original does this for the mummy's
   * chatter inside the case (line 8702) and for its three-way brush-off.
   */
  sayRandom?: Say[][];
  /**
   * A kindness the original lacks: ask before an irreversible mistake. The first
   * attempt prints this and does nothing; repeating the command goes through.
   * Used for EAT FOOD, which silently makes the game unwinnable.
   */
  confirm?: string;
  /** Back-reference to the BASIC line this was transcribed from. */
  origin: string;
}

/* -------------------------------------------------------------------------- *
 * Commands
 * -------------------------------------------------------------------------- */

/** What the player's noun resolved to. Produced by the parser (phase 3). */
export type CommandTarget =
  | { kind: "object"; key: string }
  | { kind: "scenery"; code: number; word: string }
  | { kind: "direction"; direction: Direction }
  | { kind: "none" };

export interface Command {
  verb: string;
  target: CommandTarget;
  /** What the player actually typed, for error messages and the transcript. */
  raw: string;
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
