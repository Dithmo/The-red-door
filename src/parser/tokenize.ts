/**
 * Tokenising, and the fuzzy matching used when a word is not recognised.
 *
 * The original read a fixed-length string and compared the first five letters of
 * each of two words against its tables. There was no punctuation handling, no
 * articles, no way to say anything else. Everything here exists to widen that.
 */

/** Words that carry no meaning and are dropped before matching. */
export const DEFAULT_NOISE = new Set([
  "the",
  "a",
  "an",
  "my",
  "some",
  "of",
  "please",
  "then",
  "that",
  "this",
]);

export interface Tokens {
  /** Cleaned, lowercased words with noise removed. */
  words: string[];
  /** The input as typed, for echoing back in messages. */
  raw: string;
}

export function tokenize(input: string, noise: Iterable<string> = DEFAULT_NOISE): Tokens {
  const raw = input.trim();
  const noiseSet = new Set(noise);

  const words = raw
    .toLowerCase()
    // Keep letters, digits, spaces, apostrophes and hyphens; drop the rest.
    .replace(/[^a-z0-9\s'-]/g, " ")
    // "don't" -> "dont" so it matches vocabulary entries written without them.
    .replace(/'/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !noiseSet.has(word));

  return { words, raw };
}

/**
 * Levenshtein distance, capped: once it is clear the distance exceeds `max` we
 * stop, because all we ever ask is "is this within a typo or two".
 */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + cost,
      );
      current.push(value);
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    previous = current;
  }

  return previous[b.length]!;
}

/**
 * How much typo tolerance a word of this length earns. Short words get none --
 * "cut" and "cat" are both plausible, and guessing between them is worse than
 * asking.
 */
export function toleranceFor(word: string): number {
  if (word.length <= 3) return 0;
  if (word.length <= 5) return 1;
  return 2;
}

/** How many leading characters two words share. */
function commonPrefix(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) i += 1;
  return i;
}

/**
 * The closest vocabulary word to `word`, if one is close enough to be worth
 * suggesting.
 *
 * Ties on edit distance are broken by the longest shared prefix, then the
 * shorter candidate, then alphabetically. The prefix rule matters: "baskte" and
 * "taste" are both two edits from "basket", but a transposition in a word that
 * starts the same way is the far likelier typo, and length alone picked "taste".
 */
export function closestWord(
  word: string,
  vocabulary: Iterable<string>,
): string | undefined {
  const tolerance = toleranceFor(word);
  if (tolerance === 0) return undefined;

  let best: string | undefined;
  let bestDistance = tolerance + 1;
  let bestPrefix = -1;

  for (const candidate of vocabulary) {
    // Multi-word phrases are not typo-corrected; they are matched exactly.
    if (candidate.includes(" ")) continue;
    // Never suggest the word the player already typed.
    if (candidate === word) continue;

    const distance = editDistance(word, candidate, tolerance);
    if (distance > tolerance) continue;

    const prefix = commonPrefix(word, candidate);
    const better =
      best === undefined ||
      distance < bestDistance ||
      (distance === bestDistance &&
        (prefix > bestPrefix ||
          (prefix === bestPrefix &&
            (candidate.length < best.length ||
              (candidate.length === best.length && candidate < best)))));

    if (better) {
      best = candidate;
      bestDistance = distance;
      bestPrefix = prefix;
    }
  }

  return best;
}
