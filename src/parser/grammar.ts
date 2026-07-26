/**
 * Grammar patterns.
 *
 * Each verb declares the shapes it accepts, e.g. `unlock` takes "V N with N" and
 * "V N". That is the whole point of this rewrite: the original had exactly one
 * shape, verb + noun, so UNLOCK BOX WITH KEY was unsayable and the key had to be
 * inferred from your inventory. Both forms work now, and the terse one still
 * behaves as it always did.
 *
 * A pattern is a space-separated string of:
 *   V        the verb (always first)
 *   N        a noun phrase
 *   ALL      the words "all" / "everything"
 *   <word>   a literal, always a preposition or particle
 */

export const ALL_WORDS = new Set(["all", "everything", "every"]);

export interface PatternShape {
  /** Literal preposition/particle the pattern expects, if any. */
  preposition?: string;
  /** Does a noun phrase come before the preposition? */
  firstNoun: boolean;
  /** Does a noun phrase come after it? */
  secondNoun: boolean;
  /** Is the first slot the word ALL rather than a noun phrase? */
  firstIsAll: boolean;
}

export function parsePattern(pattern: string): PatternShape {
  const parts = pattern.split(/\s+/).filter(Boolean);
  if (parts[0] !== "V") {
    throw new Error(`pattern must start with V: "${pattern}"`);
  }

  const shape: PatternShape = {
    firstNoun: false,
    secondNoun: false,
    firstIsAll: false,
  };
  let seenPreposition = false;

  for (const part of parts.slice(1)) {
    if (part === "N") {
      if (seenPreposition) shape.secondNoun = true;
      else shape.firstNoun = true;
    } else if (part === "ALL") {
      shape.firstIsAll = true;
    } else {
      shape.preposition = part;
      seenPreposition = true;
    }
  }

  return shape;
}

/** The shape of what the player actually typed after the verb. */
export interface InputShape {
  first: string[];
  preposition?: string;
  second: string[];
}

/**
 * Split the words after the verb at the first preposition. No object or scenery
 * word in this game's vocabulary is also a preposition, so this cannot mis-split
 * a noun phrase.
 */
export function shapeOf(words: string[], prepositions: Iterable<string>): InputShape {
  const preps = new Set(prepositions);
  const at = words.findIndex((word) => preps.has(word));
  if (at === -1) return { first: words, second: [] };
  return {
    first: words.slice(0, at),
    preposition: words[at]!,
    second: words.slice(at + 1),
  };
}

/**
 * Every reading of the words after the verb, most-split first.
 *
 * Some words are both a preposition and a noun the player can name. DOWN is the
 * clearest case: `EXAMINE DOWN` in "the room full of DOWN" is how you find the
 * navel fluff, but DOWN is also the particle in "V down N". Splitting eagerly
 * turned that command into "examine (nothing) down (nothing)" and lost a puzzle
 * step. So we offer both readings and let the patterns choose.
 */
export function candidateShapes(
  words: string[],
  prepositions: Iterable<string>,
): InputShape[] {
  const split = shapeOf(words, prepositions);
  const unsplit: InputShape = { first: words, second: [] };
  if (split.preposition === undefined) return [unsplit];
  return [split, unsplit];
}

function isAll(words: string[]): boolean {
  return words.length === 1 && ALL_WORDS.has(words[0]!);
}

/** Does the typed shape fit this pattern? */
export function shapeMatches(shape: PatternShape, input: InputShape): boolean {
  if ((shape.preposition ?? null) !== (input.preposition ?? null)) return false;

  if (shape.firstIsAll) {
    if (!isAll(input.first)) return false;
  } else if (shape.firstNoun) {
    if (input.first.length === 0 || isAll(input.first)) return false;
  } else if (input.first.length > 0) {
    // The pattern expects nothing before the preposition (e.g. "V in N"), or
    // nothing at all (e.g. "V"), but words are present.
    if (!shape.preposition) return false;
    return false;
  }

  if (shape.secondNoun) {
    if (input.second.length === 0) return false;
  } else if (input.second.length > 0) {
    return false;
  }

  return true;
}

/**
 * A literal particle pattern like "V around" is expressed as a preposition with
 * no noun phrases, so `shapeOf` needs to treat those particles as prepositions
 * too. This collects every literal any pattern uses.
 */
export function literalsIn(patterns: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const pattern of patterns) {
    for (const part of pattern.split(/\s+/)) {
      if (part !== "V" && part !== "N" && part !== "ALL") out.add(part);
    }
  }
  return out;
}
