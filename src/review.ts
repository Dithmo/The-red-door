/**
 * Data-review harness.
 *
 * NOT the game -- that arrives with the parser and rule engine. This exists to
 * verify the port end to end: every room's text, every conditional variant, and
 * every image slot, with the flags that gate them toggleable so each state can
 * actually be looked at. It is also how artwork gets reviewed as it lands.
 */

import { flagNames, lexicon, objects, rooms, validate } from "./data/index";
import type { Condition, Room } from "./data/types";
import { CARRIED, NOWHERE } from "./data/types";
import type { ConditionContext } from "./engine/conditions";
import {
  availableExits,
  describeRoom,
  inkColour,
  resolveImage,
} from "./engine/describe";

const app = document.getElementById("app")!;

/** Flags that gate any visible text or picture, so the harness can toggle them. */
function gatingConditions(room: Room): Condition[] {
  return [
    ...(room.descriptionVariants ?? []).flatMap((v) => v.when),
    ...(room.descriptionFragments ?? []).flatMap((f) => f.when),
    ...room.images.flatMap((i) => i.when ?? []),
  ];
}

function gatingFlags(room: Room): { flag: string; values: number[] }[] {
  const found = new Map<string, Set<number>>();
  for (const cond of gatingConditions(room)) {
    if (!("flag" in cond)) continue;
    const value = "eq" in cond ? cond.eq : "lt" in cond ? cond.lt : cond.gte;
    const set = found.get(cond.flag) ?? new Set<number>();
    set.add(value);
    found.set(cond.flag, set);
  }
  return [...found].map(([flag, values]) => ({
    flag,
    values: [...values].sort((a, b) => a - b),
  }));
}

const state = {
  roomId: 1,
  flags: {} as Record<string, number>,
};

function context(room: Room): ConditionContext {
  // Objects sit wherever they start; enough for reviewing text and pictures.
  const objectLocations: Record<string, number> = {};
  for (const obj of objects) objectLocations[obj.key] = obj.startsAt;
  return { room: room.id, flags: state.flags, objects: objectLocations };
}

function el(html: string): string {
  return html;
}

function escape(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}

function renderNav(): string {
  const items = rooms
    .map((room) => {
      const current = room.id === state.roomId;
      return el(`
        <button data-room="${room.id}" aria-current="${current}"
                style="--swatch:${inkColour(room.ink)}">
          <span class="dot" style="background:${inkColour(room.ink)}"></span>
          <span class="id">${room.id}</span>${escape(room.name)}
        </button>`);
    })
    .join("");
  return `<nav><h1>Rooms (${rooms.length})</h1>${items}</nav>`;
}

function renderRoom(): string {
  const room = rooms.find((r) => r.id === state.roomId)!;
  const ctx = context(room);
  const image = resolveImage(room, ctx);
  const swatch = inkColour(room.ink);
  const flags = gatingFlags(room);

  const toggles = flags.length
    ? el(`
      <section>
        <h3>Flags affecting this room</h3>
        <div class="state">
          ${flags
            .flatMap(({ flag, values }) =>
              values.map(
                (v) => el(`
              <label>
                <input type="checkbox" data-flag="${flag}" data-value="${v}"
                  ${state.flags[flag] === v ? "checked" : ""} />
                ${flag} = ${v}
              </label>`),
              ),
            )
            .join("")}
        </div>
      </section>`)
    : "";

  const exits = availableExits(room);
  const exitRows = exits.length
    ? exits
        .map(
          (dir) =>
            el(`<tr><th>${dir}</th><td>${
              rooms.find((r) => r.id === room.exits[dir as keyof typeof room.exits])
                ?.name ?? "?"
            } <code>#${room.exits[dir as keyof typeof room.exits]}</code></td></tr>`),
        )
        .join("")
    : `<tr><td colspan="2" style="color:var(--dim)">none — left by a scripted event, or fatal</td></tr>`;

  const here = objects.filter((o) => o.startsAt === room.id);
  const hereRows = here.length
    ? here
        .map(
          (o) =>
            el(`<tr><th>${escape(o.noun)}</th><td>${escape(o.description)} <code>#${o.id} ${o.key}</code></td></tr>`),
        )
        .join("")
    : `<tr><td colspan="2" style="color:var(--dim)">nothing here at the start</td></tr>`;

  const fatal = room.fatal
    ? el(`<section><h3>Fatal on entry</h3>
        <div class="fatal">${escape(room.fatal.text)}
        <br /><code>${room.fatal.origin}</code></div></section>`)
    : "";

  return el(`
    <main style="--swatch:${swatch}">
      <div class="head">
        <h2>${escape(room.name)}</h2>
        <span class="meta">#${room.id} · ${room.key} · ink ${room.ink} · ${room.origin}</span>
      </div>

      <div class="panes">
        <figure class="picture" style="margin:0">
          <img src="./images/${image.src}" alt="${escape(room.name)}" />
          <figcaption>${image.src}${
            image.when ? ` — when ${escape(JSON.stringify(image.when))}` : " — default"
          }</figcaption>
        </figure>
        <div>
          <p class="prose">${escape(describeRoom(room, ctx))}</p>
          ${toggles}
        </div>
      </div>

      ${fatal}

      <section>
        <h3>Exits</h3>
        <table>${exitRows}</table>
      </section>

      <section>
        <h3>Objects starting here</h3>
        <table>${hereRows}</table>
      </section>

      <section>
        <h3>Image slots (${room.images.length})</h3>
        <table>${room.images
          .map(
            (slot) =>
              el(`<tr><th>${slot.src}</th><td><code>${
                slot.when ? escape(JSON.stringify(slot.when)) : "default"
              }</code></td></tr>`),
          )
          .join("")}</table>
      </section>
    </main>`);
}

function render(): void {
  const problems = validate();
  const banner = problems.length
    ? el(`<div class="problems"><strong>${problems.length} data problem(s)</strong>
        <ul>${problems.map((p) => `<li>${escape(p)}</li>`).join("")}</ul></div>`)
    : "";

  app.innerHTML = renderNav() + renderRoom();
  if (banner) {
    app.querySelector("main")!.insertAdjacentHTML("afterbegin", banner);
  }
}

app.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const button = target.closest<HTMLElement>("button[data-room]");
  if (button) {
    state.roomId = Number(button.dataset.room);
    render();
  }
});

app.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  const flag = input.dataset.flag;
  if (!flag) return;
  const value = Number(input.dataset.value);
  if (input.checked) {
    state.flags[flag] = value;
  } else {
    delete state.flags[flag];
  }
  render();
});

render();

// Surface the port's shape in the console for a quick sanity read.
const placed = objects.filter(
  (o) => o.startsAt !== NOWHERE && o.startsAt !== CARRIED,
).length;
console.info(
  `The Red Door — data review\n` +
    `${rooms.length} rooms · ${objects.length} objects (${placed} placed, ` +
    `1 carried) · ${lexicon.verbs.length} verbs · ` +
    `${lexicon.scenery.length} scenery nouns · ` +
    `${Object.keys(flagNames).length} flags\n` +
    `${validate().length} data problems`,
);
