/**
 * @vitest-environment jsdom
 *
 * Smoke tests for the DOM wiring in src/main.ts.
 *
 * The game logic is covered elsewhere; what is checked here is the part that is
 * otherwise invisible until someone opens the page -- that the markup and the
 * script agree, that a typed command reaches the session, and that the picture,
 * accent colour and status line follow the world.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PROJECT = resolve(__dirname, "..");

/** The real index.html body, so the test fails if the markup and script drift. */
function loadMarkup(): void {
  const html = readFileSync(resolve(PROJECT, "index.html"), "utf8");
  const body = /<body>([\s\S]*?)<\/body>/.exec(html)?.[1] ?? "";
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, "");
}

async function boot(): Promise<void> {
  loadMarkup();
  vi.resetModules();
  await import("../src/main");
}

function type(command: string): void {
  const input = document.getElementById("input") as HTMLInputElement;
  input.value = command;
  document
    .getElementById("prompt")!
    .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

function transcript(): string {
  return document.getElementById("turns")!.textContent ?? "";
}

beforeEach(() => {
  localStorage.clear();
  // jsdom has no layout, so scrollIntoView is not implemented.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("the game page", () => {
  it("opens in the tomb with the room's picture and accent", async () => {
    await boot();

    expect(transcript()).toContain("EGYPTIAN TOMB");
    expect(document.getElementById("place")!.textContent).toContain(
      "Egyptian Tomb",
    );
    // Room 1 is ink 1 -- Spectrum blue.
    expect(
      document.documentElement.style.getPropertyValue("--accent"),
    ).toBe("#0000ff");
    expect(document.getElementById("status-carry")!.textContent).toBe(
      "carrying 1/6",
    );
    expect(document.getElementById("status-turn")!.textContent).toBe("turn 0");
  });

  it("plays a command and echoes it", async () => {
    await boot();
    type("north");

    expect(transcript()).toContain("north");
    expect(transcript()).toContain("male MUMMY");
    expect(document.getElementById("status-turn")!.textContent).toBe("turn 1");
    expect(document.getElementById("place")!.textContent).toContain(
      "male MUMMY",
    );
  });

  it("changes the accent colour with the room", async () => {
    await boot();
    type("north"); // room 2 is ink 3, magenta
    expect(
      document.documentElement.style.getPropertyValue("--accent"),
    ).toBe("#ff00ff");
  });

  it("enables undo only once there is something to take back", async () => {
    await boot();
    const undo = document.getElementById("undo") as HTMLButtonElement;
    expect(undo.disabled).toBe(true);

    type("north");
    expect(undo.disabled).toBe(false);

    undo.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(transcript()).toContain("Taken back");
    expect(document.getElementById("status-turn")!.textContent).toBe("turn 0");
  });

  it("shows a parser complaint without taking a turn", async () => {
    await boot();
    type("xyzzy");
    expect(transcript()).toContain('I don\'t know the word "xyzzy"');
    expect(document.getElementById("status-turn")!.textContent).toBe("turn 0");
  });

  it("offers a restart when the game ends", async () => {
    await boot();
    // Straight into the snake pit.
    type("north");
    type("south");
    type("south");
    type("north");
    type("west");
    type("west");
    type("west");
    type("south");
    type("down");

    expect(transcript()).toContain("asp time");
    const ending = document.querySelector(".ending");
    expect(ending).not.toBeNull();
    expect(ending!.textContent).toContain("That is the end.");

    const restart = [...ending!.querySelectorAll("button")].find(
      (b) => b.textContent === "Start again",
    )!;
    restart.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector(".ending")).toBeNull();
    expect(transcript()).toContain("EGYPTIAN TOMB");
    expect(document.getElementById("status-turn")!.textContent).toBe("turn 0");
  });

  it("recalls previous commands with the up arrow", async () => {
    await boot();
    const input = document.getElementById("input") as HTMLInputElement;
    type("north");
    type("look");

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    expect(input.value).toBe("look");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    expect(input.value).toBe("north");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    expect(input.value).toBe("look");
  });

  it("autosaves and resumes where it left off", async () => {
    await boot();
    type("north");
    type("south");
    type("south"); // room 3

    // A fresh page load with the same storage should pick the game back up.
    await boot();
    expect(transcript()).toContain("Resumed where you left off.");
    expect(transcript()).toContain("female MUMMY");
    expect(document.getElementById("status-turn")!.textContent).toBe("turn 3");
  });

  it("survives storage being unavailable", async () => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    try {
      await boot();
      type("north");
      expect(transcript()).toContain("male MUMMY");
    } finally {
      Storage.prototype.setItem = setItem;
    }
  });
});
