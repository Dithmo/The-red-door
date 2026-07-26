/**
 * A play session: typed English in, lines of output out.
 *
 * This is the seam the UI sits on. It owns the parser state (pronouns, the
 * question we are waiting on) and the Game (world, rules, undo), and nothing
 * above it needs to know how either works.
 */

import type { Command } from "./data/types";
import { Game, type OutputLine, type TurnResult } from "./engine/game";
import { createWorld, type World } from "./engine/world";
import {
  createParserState,
  parse,
  type ParserState,
} from "./parser/parser";
import { rules } from "./rules/index";

export interface SessionTurn {
  lines: OutputLine[];
  image?: string;
  ended?: { outcome: "win" | "lose" };
  /** Rules that fired, for the transcription audit and debugging. */
  firedRules: string[];
}

export class Session {
  readonly game: Game;
  private parserState: ParserState;
  /** The last command run, for AGAIN. */
  private lastInput: string | undefined;

  constructor(world: World = createWorld()) {
    this.game = new Game(rules, world);
    this.parserState = createParserState();
  }

  get world(): World {
    return this.game.world;
  }

  /** The opening description, including any arrival events for room 1. */
  begin(): SessionTurn {
    return this.wrap(this.game.begin());
  }

  /** The current room as it reads now, without taking a turn. */
  describe(): SessionTurn {
    return this.wrap(this.game.describe());
  }

  send(input: string): SessionTurn {
    const outcome = parse(input, this.game.world, this.parserState);

    switch (outcome.kind) {
      case "meta":
        if (outcome.meta === "undo") {
          this.parserState = createParserState();
          return this.wrap(this.game.undo());
        }
        // AGAIN: re-run the last real input.
        if (this.lastInput === undefined) {
          return this.system("There is nothing to repeat.");
        }
        return this.send(this.lastInput);

      case "clarify":
        // Not a turn: no time passes and nothing changes.
        return this.system(outcome.message);

      case "failure":
        return this.system(outcome.message);

      case "commands": {
        this.lastInput = input;
        return this.runAll(outcome.commands);
      }
    }
  }

  /**
   * Run a batch of commands (TAKE ALL expands to several). Each is prefixed with
   * the object's name when there is more than one, so the transcript reads like
   * a list rather than a run of bare "OK"s. Stops early if the game ends.
   */
  private runAll(commands: Command[]): SessionTurn {
    const lines: OutputLine[] = [];
    const firedRules: string[] = [];
    let image: string | undefined;
    let ended: { outcome: "win" | "lose" } | undefined;

    for (const command of commands) {
      const result = this.game.execute(command);
      if (commands.length > 1 && command.target.kind === "object") {
        lines.push({ text: `${command.raw}:`, kind: "system" });
      }
      lines.push(...result.lines);
      if (result.image) image = result.image;
      if (result.firedRule) firedRules.push(result.firedRule);
      if (result.ended) {
        ended = result.ended;
        break;
      }
    }

    return {
      lines,
      ...(image ? { image } : {}),
      ...(ended ? { ended } : {}),
      firedRules,
    };
  }

  private wrap(result: TurnResult): SessionTurn {
    return {
      lines: result.lines,
      ...(result.image ? { image: result.image } : {}),
      ...(result.ended ? { ended: result.ended } : {}),
      firedRules: result.firedRule ? [result.firedRule] : [],
    };
  }

  private system(message: string): SessionTurn {
    return { lines: [{ text: message, kind: "system" }], firedRules: [] };
  }
}
