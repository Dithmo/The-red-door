/**
 * The game.
 *
 * Everything below the surface is in src/session.ts: this file only turns typed
 * strings into turns and turns into DOM. It deliberately knows nothing about
 * rules, the parser or the world model.
 */

import { roomById } from "./data/index";
import { inkColour } from "./engine/describe";
import { carriedCount, createWorld } from "./engine/world";
import {
  listSaves,
  load,
  localStorageStore,
  save,
  type SaveStore,
} from "./engine/save";
import type { OutputLine } from "./engine/game";
import { Session, type SessionTurn } from "./session";
import { CARRY_LIMIT } from "./data/types";

declare global {
  interface Window {
    /**
     * Filename -> data URI, injected by tools/build_standalone.mjs.
     *
     * The single-file build has no server to fetch ./images/ from, so the
     * pictures travel inside the page. Absent in the normal build, where they
     * are served as files.
     */
    __RED_DOOR_IMAGES__?: Record<string, string>;
  }
}

/** Where to load a picture from: inlined if this is the single-file build. */
function imageUrl(src: string): string {
  return window.__RED_DOOR_IMAGES__?.[src] ?? `./images/${src}`;
}

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
};

const transcriptEl = el<HTMLDivElement>("transcript");
const turnsEl = el<HTMLDivElement>("turns");
const inputEl = el<HTMLInputElement>("input");
const formEl = el<HTMLFormElement>("prompt");
const pictureEl = el<HTMLImageElement>("picture");
const placeEl = el<HTMLElement>("place");
const undoEl = el<HTMLButtonElement>("undo");
const carryEl = el<HTMLElement>("status-carry");
const turnEl = el<HTMLElement>("status-turn");

const AUTOSAVE = "autosave";
const store: SaveStore = localStorageStore();

let session = new Session(createWorld());
/** Commands the player has typed, for the up/down arrows. */
let history: string[] = [];
let historyIndex = 0;
let currentImage = "";

/* --------------------------------------------------------------- rendering -- */

function lineElement(line: OutputLine, previous?: OutputLine): HTMLElement {
  const p = document.createElement("p");
  p.className = `line ${line.kind}`;
  // "Here you can see:" heads the object list; the items under it are indented.
  if (line.kind === "objects" && previous?.kind !== "objects") {
    p.classList.add("heading");
  }
  p.textContent = line.text;
  return p;
}

function appendTurn(echo: string | undefined, result: SessionTurn): void {
  const turn = document.createElement("div");
  turn.className = "turn";

  if (echo !== undefined) {
    const said = document.createElement("p");
    said.className = "echo";
    said.textContent = echo;
    turn.append(said);
  }

  result.lines.forEach((line, i) => {
    turn.append(lineElement(line, result.lines[i - 1]));
  });

  if (result.ended) turn.append(endingElement(result.ended.outcome));

  turnsEl.append(turn);
  // Put the newest turn at the top of the view rather than the bottom, so a long
  // room description is read from its first line.
  turn.scrollIntoView({ block: "start", behavior: "smooth" });
}

function endingElement(outcome: "win" | "lose"): HTMLElement {
  const box = document.createElement("div");
  box.className = "ending";

  const heading = document.createElement("h2");
  heading.textContent = outcome === "win" ? "You escaped." : "That is the end.";

  const note = document.createElement("p");
  note.textContent =
    outcome === "win"
      ? "Thoth was satisfied, and you woke up at home."
      : "Take back the last move, or begin again.";

  const undo = document.createElement("button");
  undo.type = "button";
  undo.textContent = "Undo";
  undo.addEventListener("click", doUndo);

  const restart = document.createElement("button");
  restart.type = "button";
  restart.textContent = "Start again";
  restart.addEventListener("click", () => restartGame());

  box.append(heading, note, undo, restart);
  return box;
}

function applyTurn(echo: string | undefined, result: SessionTurn): void {
  const room = roomById.get(session.world.room);
  if (room) {
    const accent = inkColour(room.ink);
    document.documentElement.style.setProperty("--accent", accent);
    placeEl.textContent = room.name;
  }

  if (result.image && result.image !== currentImage) {
    currentImage = result.image;
    pictureEl.classList.add("changing");
    const next = new Image();
    next.onload = () => {
      pictureEl.src = next.src;
      pictureEl.alt = room?.name ?? "";
      pictureEl.classList.remove("changing");
    };
    next.onerror = () => pictureEl.classList.remove("changing");
    next.src = imageUrl(result.image);
  }

  appendTurn(echo, result);
  refreshStatus();
  autosave();
}

function refreshStatus(): void {
  const carried = carriedCount(session.world);
  carryEl.textContent = `carrying ${carried}/${CARRY_LIMIT}`;
  turnEl.textContent = `turn ${session.world.turn}`;
  undoEl.disabled = !session.game.canUndo;
}

/* ----------------------------------------------------------------- actions -- */

function submit(raw: string): void {
  const text = raw.trim();
  if (!text) return;

  if (history[history.length - 1] !== text) history.push(text);
  historyIndex = history.length;

  applyTurn(text, session.send(text));
  inputEl.value = "";
  inputEl.focus();
}

function doUndo(): void {
  applyTurn("undo", session.send("undo"));
  inputEl.focus();
}

function restartGame(): void {
  session = new Session(createWorld());
  history = [];
  historyIndex = 0;
  currentImage = "";
  turnsEl.replaceChildren();
  applyTurn(undefined, session.begin());
  inputEl.focus();
}

/* -------------------------------------------------------------- persistence -- */

/**
 * Autosave every turn so closing the tab does not lose the game. This is
 * separate from the SAVE/LOAD verbs, which the original has and which write
 * named slots the player chooses.
 */
function autosave(): void {
  try {
    save(store, AUTOSAVE, session.world);
  } catch {
    // A full or blocked localStorage must not stop play.
  }
}

function resume(): boolean {
  try {
    if (!listSaves(store).some((slot) => slot.name === AUTOSAVE)) return false;
    const result = load(store, AUTOSAVE);
    if (!result.ok) return false;
    session = new Session(result.world);
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- wiring -- */

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  submit(inputEl.value);
});

undoEl.addEventListener("click", doUndo);

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex -= 1;
      inputEl.value = history[historyIndex] ?? "";
      // Put the caret at the end rather than wherever it was.
      requestAnimationFrame(() => inputEl.setSelectionRange(999, 999));
    }
    event.preventDefault();
  } else if (event.key === "ArrowDown") {
    if (historyIndex < history.length) {
      historyIndex += 1;
      inputEl.value = history[historyIndex] ?? "";
    }
    event.preventDefault();
  } else if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    doUndo();
  }
});

// Typing anywhere on the page goes to the prompt.
document.addEventListener("keydown", (event) => {
  if (event.target === inputEl) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length === 1) inputEl.focus();
});

const resumed = resume();
applyTurn(undefined, resumed ? session.describe() : session.begin());
if (resumed) {
  turnsEl.prepend(
    Object.assign(document.createElement("p"), {
      className: "line system",
      textContent: "Resumed where you left off.",
    }),
  );
}
inputEl.focus();
