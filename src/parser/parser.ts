/**
 * The parser.
 *
 * Pipeline: tokenize -> find the verb -> fit a grammar pattern -> resolve the
 * noun phrases against scope -> emit a Command, a question, or a specific
 * complaint.
 *
 * The original answered every failure with "Apologies from authors!", which told
 * the player nothing about whether the word, the object, or the action was the
 * problem. Distinguishing those four cases is most of the value here.
 */

import type { Command, CommandTarget, VerbSpec } from "../data/types";
import type { World } from "../engine/world";
import {
  candidateShapes,
  literalsIn,
  parsePattern,
  shapeMatches,
  type InputShape,
} from "./grammar";
import { lexicon, directionIndex, lookup, suggest, verbIndex, verbPhrases } from "./lexicon";
import {
  distinguish,
  everythingIn,
  readNounPhrase,
  resolve,
  resolveAmong,
  scopeOf,
  type Pronouns,
  type Resolution,
} from "./resolve";
import { tokenize } from "./tokenize";

export type MetaCommand = "undo" | "again";

export type ParseOutcome =
  /** One or more commands to execute, in order. */
  | { kind: "commands"; commands: Command[] }
  /** A session-level action, not a game verb. */
  | { kind: "meta"; meta: MetaCommand }
  /** Needs an answer before it can be run. */
  | { kind: "clarify"; message: string; verb: string; options: string[] }
  | { kind: "failure"; reason: FailureReason; message: string };

export type FailureReason =
  | "empty"
  | "unknown-word"
  | "no-verb"
  | "bad-pattern"
  | "not-here"
  | "no-such-variant"
  | "nothing-to-take"
  | "nothing-to-drop";

/** Prepositions and particles any pattern uses, plus the ALL-exclusion words. */
const PATTERN_LITERALS = literalsIn(
  lexicon.verbs.flatMap((verb) => verb.patterns),
);

const ALL_PREPOSITIONS = new Set([
  ...lexicon.prepositions,
  ...PATTERN_LITERALS,
]);

const META: Record<string, MetaCommand> = {
  undo: "undo",
  oops: "undo",
  again: "again",
  g: "again",
};

export interface ParserState {
  pronouns: Pronouns;
  /** A question we asked and are waiting on an answer to. */
  pending:
    | {
        verb: VerbSpec;
        shape: InputShape;
        slot: "first" | "second";
        /** The objects we offered, so the answer is read against those. */
        candidates: import("../data/types").GameObject[];
      }
    | undefined;
}

export function createParserState(): ParserState {
  return { pronouns: {}, pending: undefined };
}

/* ------------------------------------------------------------------ verbs -- */

interface VerbHit {
  verbs: VerbSpec[];
  rest: string[];
}

/**
 * Find the verb at the start of the input. Multi-word phrases are tried first and
 * longest-first, so "pick up lamp" and "look at door" beat "pick" and "look".
 *
 * A word can name several verbs; all are returned and the grammar picks.
 */
function findVerb(words: string[]): VerbHit | undefined {
  for (const phrase of verbPhrases) {
    if (phrase.words.length > words.length) continue;
    if (phrase.words.every((word, i) => words[i] === word)) {
      return { verbs: [phrase.verb], rest: words.slice(phrase.words.length) };
    }
  }

  const first = words[0];
  if (first === undefined) return undefined;

  const match = lookup(verbIndex, first);
  if (match.how === "none") return undefined;
  return { verbs: match.values, rest: words.slice(1) };
}

/* --------------------------------------------------------------- messages -- */

function listOptions(options: string[]): string {
  if (options.length <= 1) return options[0] ?? "";
  return `${options.slice(0, -1).join(", ")} or ${options[options.length - 1]}`;
}

/* ----------------------------------------------------------------- parser -- */

export function parse(
  input: string,
  world: World,
  state: ParserState = createParserState(),
): ParseOutcome {
  const { words, raw } = tokenize(input, lexicon.noiseWords);

  if (words.length === 0) {
    return { kind: "failure", reason: "empty", message: "I beg your pardon?" };
  }

  // An answer to a question we asked last turn: "which token?" -> "bronze".
  if (state.pending) {
    const pending = state.pending;
    state.pending = undefined;

    // Read the answer against the options we offered, not the whole room: "gold"
    // means one of the two tokens we asked about, even though other gold things
    // may be in the player's hands.
    const chosen = resolveAmong(words, pending.candidates);
    if (chosen) {
      state.pronouns.it = chosen.key;
      return {
        kind: "commands",
        commands: [
          {
            verb: pending.verb.name,
            target: { kind: "object", key: chosen.key },
            raw,
          },
        ],
      };
    }
    // Not an answer -- fall through and treat it as a fresh command.
  }

  const meta = words.length === 1 ? META[words[0]!] : undefined;
  if (meta) return { kind: "meta", meta };

  // A bare direction is a movement command with the verb left implicit -- which
  // is how almost everyone plays. The original accepted it by looking the word up
  // in both tables at once; here it is an explicit case.
  if (words.length === 1 && lookup(directionIndex, words[0]!).how !== "none") {
    return directionCommand(words, raw, world);
  }

  const hit = findVerb(words);
  if (!hit) {
    return unknownFirstWord(words[0]!, words, world);
  }

  // Shapes outermost, verbs within. A word can be both a particle and a noun
  // ("look around" vs "examine down"), and a verb can have several readings, so
  // the most-split reading has to be offered to *every* candidate verb before
  // any of them falls back to the unsplit one. Verb-first ordering let `examine`
  // claim "look around" as "examine the around".
  const shapes = candidateShapes(hit.rest, ALL_PREPOSITIONS);
  let lastFailure: ParseOutcome | undefined;

  for (const shape of shapes) {
    for (const verb of hit.verbs) {
      const outcome = parseWithVerb(verb, shape, raw, world, state);
      if (outcome.kind !== "failure" || outcome.reason !== "bad-pattern") {
        return outcome;
      }
      lastFailure ??= outcome;
    }
  }

  return (
    lastFailure ?? {
      kind: "failure",
      reason: "bad-pattern",
      message: "I did not understand that.",
    }
  );
}

function unknownFirstWord(
  word: string,
  words: string[],
  world: World,
): ParseOutcome {
  // A noun typed on its own is a common slip -- say what is missing.
  const scope = scopeOf(world);
  const asNoun = resolve(readNounPhrase(words), scope);
  if (asNoun.kind === "object" || asNoun.kind === "scenery") {
    const name = asNoun.kind === "object" ? asNoun.object.noun : asNoun.word;
    return {
      kind: "failure",
      reason: "no-verb",
      message: `You will have to say what to do with the ${name}.`,
    };
  }

  const hint = suggest(word);
  return {
    kind: "failure",
    reason: "unknown-word",
    message: hint
      ? `I don't know the word "${word}". Did you mean "${hint}"?`
      : `I don't know the word "${word}".`,
  };
}

function parseWithVerb(
  verb: VerbSpec,
  shape: InputShape,
  raw: string,
  world: World,
  state: ParserState,
): ParseOutcome {
  const pattern = verb.patterns
    .map(parsePattern)
    .find((candidate) => shapeMatches(candidate, shape));

  if (!pattern) {
    return {
      kind: "failure",
      reason: "bad-pattern",
      message: badPatternMessage(verb, shape),
    };
  }

  // Bare direction handling: "go north", and also "north" on its own, which
  // arrives here as the `go` verb with the direction in the first slot.
  if (verb.name === "go") {
    return directionCommand(shape.first.concat(shape.second), raw, world);
  }

  // TAKE ALL / DROP ALL -- the original had no such thing.
  if (pattern.firstIsAll) {
    return allCommand(verb, shape, raw, world, state);
  }

  const scope = scopeOf(world);

  // The slot the verb is really about: for "V N <prep> N" that is the first
  // noun; for "V <prep> N" (SWIM IN POOL) it is the second.
  const primaryWords = pattern.firstNoun ? shape.first : shape.second;
  const primarySlot: "first" | "second" = pattern.firstNoun ? "first" : "second";

  if (primaryWords.length === 0) {
    return {
      kind: "commands",
      commands: [{ verb: verb.name, target: { kind: "none" }, raw }],
    };
  }

  const phrase = readNounPhrase(primaryWords);
  const resolution = resolve(phrase, scope, state.pronouns);

  const target = targetFor(resolution);
  if (!target) {
    return failureFor(resolution, verb, shape, primarySlot, state);
  }

  if (target.kind === "object") state.pronouns.it = target.key;

  return { kind: "commands", commands: [{ verb: verb.name, target, raw }] };
}

function targetFor(resolution: Resolution): CommandTarget | undefined {
  if (resolution.kind === "object") {
    return { kind: "object", key: resolution.object.key };
  }
  if (resolution.kind === "scenery") {
    return { kind: "scenery", code: resolution.code, word: resolution.word };
  }
  if (resolution.kind === "direction") {
    // EXAMINE DOWN and the like -- directions are nouns 36-41 in the original.
    return { kind: "direction", direction: resolution.direction };
  }
  return undefined;
}

function failureFor(
  resolution: Resolution,
  verb: VerbSpec,
  shape: InputShape,
  slot: "first" | "second",
  state: ParserState,
): ParseOutcome {
  switch (resolution.kind) {
    case "ambiguous": {
      const options = resolution.candidates.map((obj) =>
        distinguish(obj, resolution.candidates),
      );
      state.pending = { verb, shape, slot, candidates: resolution.candidates };
      return {
        kind: "clarify",
        verb: verb.name,
        options,
        message: `Which do you mean, the ${listOptions(options)}?`,
      };
    }
    case "dangling-pronoun":
      return {
        kind: "failure",
        reason: "not-here",
        message: `I'm not sure what you mean by "${resolution.word}".`,
      };
    case "not-here":
      return {
        kind: "failure",
        reason: "not-here",
        message: `You can't see any ${resolution.phrase.text} here.`,
      };
    case "no-such-variant": {
      const options = resolution.candidates.map((obj) =>
        distinguish(obj, resolution.candidates),
      );
      return {
        kind: "failure",
        reason: "no-such-variant",
        message:
          `You can't see any ${resolution.phrase.text} here` +
          (options.length ? `, only the ${listOptions(options)}.` : "."),
      };
    }
    case "unknown": {
      const hint = suggest(resolution.word);
      return {
        kind: "failure",
        reason: "unknown-word",
        message: hint
          ? `I don't know the word "${resolution.word}". Did you mean "${hint}"?`
          : `I don't know the word "${resolution.word}".`,
      };
    }
    default:
      return {
        kind: "failure",
        reason: "bad-pattern",
        message: "I did not understand that.",
      };
  }
}

function badPatternMessage(verb: VerbSpec, shape: InputShape): string {
  const wantsNoun = verb.patterns.some((p) => p.includes("N"));
  const gaveNoun = shape.first.length > 0 || shape.second.length > 0;

  if (wantsNoun && !gaveNoun) {
    return `What do you want to ${verb.name}?`;
  }
  if (!wantsNoun && gaveNoun) {
    return `I only understood you as far as wanting to ${verb.name}.`;
  }
  if (shape.preposition) {
    return `You can't ${verb.name} something ${shape.preposition} something else.`;
  }
  return `I only understood you as far as wanting to ${verb.name}.`;
}

function directionCommand(
  words: string[],
  raw: string,
  world: World,
): ParseOutcome {
  const word = words[0];
  if (word === undefined) {
    return {
      kind: "failure",
      reason: "bad-pattern",
      message: "Which way?",
    };
  }
  const match = lookup(directionIndex, word);
  if (match.how === "none") {
    // "go tomb" -- a direction was expected.
    const hint = suggest(word);
    return {
      kind: "failure",
      reason: "bad-pattern",
      message: hint
        ? `That is not a direction. Did you mean "${hint}"?`
        : `"${word}" is not a direction you can go.`,
    };
  }
  void world;
  return {
    kind: "commands",
    commands: [
      { verb: "go", target: { kind: "direction", direction: match.values[0]! }, raw },
    ],
  };
}

function allCommand(
  verb: VerbSpec,
  shape: InputShape,
  raw: string,
  world: World,
  state: ParserState,
): ParseOutcome {
  const scope = scopeOf(world);
  const held = verb.name === "drop";
  let candidates = everythingIn(scope, world, held);

  // DROP ALL BUT ROD
  if (shape.preposition && shape.second.length > 0) {
    const exclude = resolve(readNounPhrase(shape.second), scope, state.pronouns);
    if (exclude.kind === "object") {
      candidates = candidates.filter((obj) => obj.key !== exclude.object.key);
    }
  }

  if (candidates.length === 0) {
    return held
      ? {
          kind: "failure",
          reason: "nothing-to-drop",
          message: "You are not carrying anything.",
        }
      : {
          kind: "failure",
          reason: "nothing-to-take",
          message: "There is nothing here to take.",
        };
  }

  return {
    kind: "commands",
    commands: candidates.map((obj) => ({
      verb: verb.name,
      target: { kind: "object" as const, key: obj.key },
      raw: `${verb.name} ${obj.noun}`,
    })),
  };
}

/** A bare direction ("north", "n") with no verb, resolved before verb lookup. */
export function isBareDirection(input: string): boolean {
  const { words } = tokenize(input, lexicon.noiseWords);
  if (words.length !== 1) return false;
  return lookup(directionIndex, words[0]!).how !== "none";
}
