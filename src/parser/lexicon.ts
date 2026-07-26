/**
 * Word lookup.
 *
 * Three tiers, tried in order:
 *   1. exact match
 *   2. prefix match of at least MIN_PREFIX characters -- which subsumes the
 *      original's five-letter truncation, so anyone who learned to type
 *      EXAMI / UNLOC / INVEN still can
 *   3. fuzzy match, offered as a question rather than acted on silently
 *
 * A surface word can map to several verbs (LOOK is both `look` and `examine`);
 * the grammar decides which by seeing which one's patterns fit the sentence.
 */

import { lexicon, objects } from "../data/index";
import type { Direction, GameObject, VerbSpec } from "../data/types";
import { closestWord } from "./tokenize";

/**
 * Shortest prefix we will accept. Three is enough for the game's vocabulary to
 * stay unambiguous while letting people type EXA, INV, SCI.
 */
export const MIN_PREFIX = 3;

function index<T>(entries: Iterable<[string, T]>): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const [word, value] of entries) {
    const list = map.get(word) ?? [];
    if (!list.includes(value)) list.push(value);
    map.set(word, list);
  }
  return map;
}

/* ----------------------------------------------------------------- verbs -- */

const verbEntries: [string, VerbSpec][] = lexicon.verbs.flatMap((verb) =>
  verb.words.map((word) => [word, verb] as [string, VerbSpec]),
);

export const verbIndex = index(verbEntries);

/** Multi-word verb phrases ("pick up", "look at"), longest first. */
export const verbPhrases: { words: string[]; verb: VerbSpec }[] = verbEntries
  .filter(([word]) => word.includes(" "))
  .map(([word, verb]) => ({ words: word.split(" "), verb }))
  .sort((a, b) => b.words.length - a.words.length);

/* ------------------------------------------------------------ directions -- */

export const directionIndex = index(
  lexicon.directions.flatMap((dir) =>
    dir.words.map((word) => [word, dir.name] as [string, Direction]),
  ),
);

/* --------------------------------------------------------------- scenery -- */

/**
 * Scenery is global, not per-room. That is faithful: the original keeps one noun
 * table and lets each room's handler decide whether a noun means anything there,
 * falling through to a brush-off if not.
 */
export const sceneryIndex = index(
  lexicon.scenery.flatMap((entry) =>
    entry.words.map((word) => [word, entry.code] as [string, number]),
  ),
);

/* --------------------------------------------------------------- objects -- */

export const objectNounIndex = index(
  objects.map((obj) => [obj.noun, obj] as [string, GameObject]),
);

export const adjectiveWords = new Set(
  objects.flatMap((obj) => obj.adjectives),
);

/* ---------------------------------------------------------------- lookup -- */

export type WordMatch<T> =
  | { how: "exact" | "abbreviated" | "expanded"; values: T[] }
  | { how: "none" };

/**
 * Exact, then abbreviated, then expanded. Never fuzzy -- that is a separate step.
 *
 * The third tier is not a nicety: the tape stores its whole vocabulary truncated
 * to five letters (SILKW, MULBE, ANUBI, ABRAC), so the word a player naturally
 * types is often *longer* than the entry it should match. Matching only in the
 * other direction leaves ANUBIS, SILKWORMS, MULBERRY and ABRACADABRA
 * unrecognised -- and each of those is load-bearing in a puzzle.
 *
 * Tiers are tried in order and never mixed, so a real word always beats a
 * coincidental prefix.
 */
export function lookup<T>(map: Map<string, T[]>, word: string): WordMatch<T> {
  const exact = map.get(word);
  if (exact && exact.length > 0) return { how: "exact", values: exact };

  if (word.length < MIN_PREFIX) return { how: "none" };

  // The player abbreviated: "exa" -> "examine".
  const abbreviated: T[] = [];
  // The player wrote it in full but the entry is a truncation: "anubis" -> "anubi".
  const expanded: T[] = [];

  for (const [candidate, list] of map) {
    if (candidate.includes(" ")) continue;
    if (candidate.startsWith(word)) {
      for (const value of list) {
        if (!abbreviated.includes(value)) abbreviated.push(value);
      }
    } else if (candidate.length >= MIN_PREFIX && word.startsWith(candidate)) {
      for (const value of list) {
        if (!expanded.includes(value)) expanded.push(value);
      }
    }
  }

  if (abbreviated.length > 0) return { how: "abbreviated", values: abbreviated };
  if (expanded.length > 0) return { how: "expanded", values: expanded };
  return { how: "none" };
}

/** Every single word the parser knows, for typo suggestions. */
export const allWords: Set<string> = new Set([
  ...verbIndex.keys(),
  ...directionIndex.keys(),
  ...sceneryIndex.keys(),
  ...objectNounIndex.keys(),
  ...adjectiveWords,
  "all",
  "everything",
  "it",
  "them",
  "undo",
  "again",
]);

export function suggest(word: string): string | undefined {
  return closestWord(word, allWords);
}

export function isKnownWord(word: string): boolean {
  return (
    lookup(verbIndex, word).how !== "none" ||
    lookup(directionIndex, word).how !== "none" ||
    lookup(sceneryIndex, word).how !== "none" ||
    lookup(objectNounIndex, word).how !== "none" ||
    adjectiveWords.has(word)
  );
}

export { lexicon };
