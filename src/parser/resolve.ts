/**
 * Resolving a noun phrase to a thing in the world.
 *
 * The hard case this exists for: the original has five pairs of objects that
 * share a noun and differ only by adjective -- bronze/gold TOKEN, plain/threaded
 * NEEDLE, whole/shaped CLOTH, empty/full JUG, empty/snake BASKET. It dodged the
 * ambiguity by only ever letting you hold one of each pair. Here you can hold
 * both, so "token" has to be able to ask which one you meant.
 */

import { objects } from "../data/index";
import type { GameObject } from "../data/types";
import { CARRIED } from "../data/types";
import type { World } from "../engine/world";
import {
  adjectiveWords,
  directionIndex,
  lookup,
  objectNounIndex,
  sceneryIndex,
} from "./lexicon";

export interface Scope {
  /** Objects the player can refer to: held, or lying in this room. */
  present: GameObject[];
}

export function scopeOf(world: World): Scope {
  return {
    present: objects.filter((obj) => {
      const where = world.objects[obj.key];
      return where === CARRIED || where === world.room;
    }),
  };
}

/** A noun phrase, split into its modifiers and its head. */
export interface NounPhrase {
  adjectives: string[];
  head: string;
  /** The phrase as typed, for messages. */
  text: string;
}

/**
 * Split words into adjectives plus a head noun. The head is the last word that
 * names something; anything before it that is a known adjective modifies it.
 * Unknown leading words are reported rather than ignored, so "xyzzy token" does
 * not silently succeed.
 */
export function readNounPhrase(words: string[]): NounPhrase {
  const text = words.join(" ");
  if (words.length === 0) return { adjectives: [], head: "", text };
  const head = words[words.length - 1]!;
  return { adjectives: words.slice(0, -1), head, text };
}

export type Resolution =
  | { kind: "object"; object: GameObject }
  | { kind: "scenery"; code: number; word: string }
  /**
   * A direction used as a noun. The original treats directions as nouns 36-41 and
   * some handlers key on them: EXAMINE DOWN in "the room full of DOWN" is how the
   * navel FLUFF is found (line 8562).
   */
  | { kind: "direction"; direction: import("../data/types").Direction }
  | { kind: "ambiguous"; candidates: GameObject[]; phrase: NounPhrase }
  /** The word names an object, but not one that is here. */
  | { kind: "not-here"; phrase: NounPhrase }
  /** A pronoun with nothing to refer to. */
  | { kind: "dangling-pronoun"; word: string }
  /** No vocabulary entry at all. */
  | { kind: "unknown"; word: string }
  /** Adjectives given, but nothing here matches all of them. */
  | { kind: "no-such-variant"; phrase: NounPhrase; candidates: GameObject[] };

export interface Pronouns {
  it?: string;
  them?: string;
}

export const PRONOUNS = new Set(["it", "them", "him", "her", "those", "that"]);

/**
 * Resolve a noun phrase against what is in scope.
 *
 * Objects win over scenery when a word could be either. That matters for CATCH,
 * which is both verb 29 and scenery noun 100 in the original, and for words like
 * GOLD that appear as both an adjective and a scenery noun.
 */
export function resolve(
  phrase: NounPhrase,
  scope: Scope,
  pronouns: Pronouns = {},
): Resolution {
  if (phrase.head === "") return { kind: "unknown", word: "" };

  // Pronouns stand in for the last thing referred to.
  if (PRONOUNS.has(phrase.head)) {
    const key = phrase.head === "them" || phrase.head === "those"
      ? (pronouns.them ?? pronouns.it)
      : pronouns.it;
    const referent = key
      ? scope.present.find((obj) => obj.key === key)
      : undefined;
    if (referent) return { kind: "object", object: referent };
    return { kind: "dangling-pronoun", word: phrase.head };
  }

  const nounMatch = lookup(objectNounIndex, phrase.head);
  if (nounMatch.how !== "none") {
    const named = nounMatch.values;
    const inScope = named.filter((obj) =>
      scope.present.some((p) => p.key === obj.key),
    );

    /*
     * Resolve against what is here when possible, but fall back to the object the
     * word names even when it is absent.
     *
     * The original has no scope check at all: it dispatches on the noun code and
     * lets the handler decide. Several puzzles depend on that -- TAKE HAY is what
     * *creates* the hay (line 1106), and the haystack, snake and fly all answer
     * to their names before they exist as objects. Refusing the command in the
     * parser made those puzzles unreachable.
     *
     * Absence is still reported, just later: the engine says "You can't see any X
     * here" when no rule claimed the command.
     */
    const here = inScope.length > 0 ? inScope : named;

    if (phrase.adjectives.length === 0) {
      if (here.length === 1) return { kind: "object", object: here[0]! };
      // Only ask when the things being confused are actually here. Asking
      // "the wicker basket or the one with a snake in it?" about two baskets
      // neither of which is present is no help; resolve to the first and let the
      // engine say it cannot be seen.
      if (inScope.length === 0) return { kind: "object", object: here[0]! };
      return { kind: "ambiguous", candidates: here, phrase };
    }

    const matching = here.filter((obj) =>
      phrase.adjectives.every((adj) =>
        obj.adjectives.some((objAdj) => objAdj.startsWith(adj)),
      ),
    );
    if (matching.length === 1) return { kind: "object", object: matching[0]! };
    if (matching.length > 1) {
      return { kind: "ambiguous", candidates: matching, phrase };
    }
    return { kind: "no-such-variant", phrase, candidates: here };
  }

  // A bare adjective naming something present -- "rub gold", or "gold" answering
  // "which token?". This is checked *before* scenery because several adjectives
  // are also scenery nouns (GOLD is adjective and noun 82), and a word that
  // picks out something you can actually see is the more useful reading. No rule
  // in the original keys on noun 82, so nothing is lost by preferring the object.
  if (adjectiveWords.has(phrase.head)) {
    const candidates = scope.present.filter((obj) =>
      obj.adjectives.includes(phrase.head),
    );
    if (candidates.length === 1) return { kind: "object", object: candidates[0]! };
    if (candidates.length > 1) {
      return { kind: "ambiguous", candidates, phrase };
    }
  }

  const sceneryMatch = lookup(sceneryIndex, phrase.head);
  if (sceneryMatch.how !== "none") {
    return {
      kind: "scenery",
      code: sceneryMatch.values[0]!,
      word: phrase.head,
    };
  }

  const directionMatch = lookup(directionIndex, phrase.head);
  if (directionMatch.how !== "none") {
    return { kind: "direction", direction: directionMatch.values[0]! };
  }

  return { kind: "unknown", word: phrase.head };
}

/**
 * Resolve an answer to a disambiguation question against the options we offered,
 * rather than against the whole room. We asked "the bronze or the gold token?",
 * so "gold" has to mean one of those two -- even though "gold" also describes
 * other things the player is carrying.
 */
export function resolveAmong(
  words: string[],
  candidates: GameObject[],
): GameObject | undefined {
  if (words.length === 0) return undefined;
  const matching = candidates.filter((obj) =>
    words.every(
      (word) =>
        obj.noun.startsWith(word) ||
        obj.adjectives.some((adj) => adj.startsWith(word)),
    ),
  );
  return matching.length === 1 ? matching[0] : undefined;
}

/**
 * The shortest phrase that names an object unambiguously among `others` --
 * used to word a disambiguation question.
 */
export function distinguish(obj: GameObject, others: GameObject[]): string {
  const rivals = others.filter((o) => o.key !== obj.key);
  const unique = obj.adjectives.find(
    (adj) => !rivals.some((o) => o.adjectives.includes(adj)),
  );
  return unique ? `${unique} ${obj.noun}` : obj.noun;
}

/** Everything in scope, for TAKE ALL / DROP ALL. */
export function everythingIn(scope: Scope, world: World, held: boolean): GameObject[] {
  return scope.present.filter((obj) =>
    held
      ? world.objects[obj.key] === CARRIED
      : world.objects[obj.key] === world.room,
  );
}
