/**
 * Saving and loading.
 *
 * The original offers two destinations -- tape, and a "bank" in spare RAM for a
 * quick temporary save (messages 2, 3 and 4). Both collapse to named slots here.
 * Saves carry the world's PRNG seed, so a resumed game behaves identically.
 */

import type { World } from "./world";

const PREFIX = "red-door/save/";
const FORMAT = 1;

export interface SaveEnvelope {
  format: number;
  savedAt: string;
  world: World;
}

export interface SaveSlotInfo {
  name: string;
  savedAt: string;
  room: number;
  turn: number;
}

/**
 * Where saves live. Injectable so tests do not need a DOM, and so a future
 * desktop build can swap in the filesystem.
 */
export interface SaveStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export function memoryStore(seed: Record<string, string> = {}): SaveStore {
  const data = new Map(Object.entries(seed));
  return {
    get: (key) => data.get(key) ?? null,
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
    keys: () => [...data.keys()],
  };
}

export function localStorageStore(): SaveStore {
  return {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value),
    remove: (key) => localStorage.removeItem(key),
    keys: () => {
      const out: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) out.push(key);
      }
      return out;
    },
  };
}

export function save(store: SaveStore, name: string, world: World): void {
  const envelope: SaveEnvelope = {
    format: FORMAT,
    savedAt: new Date().toISOString(),
    world,
  };
  store.set(PREFIX + name, JSON.stringify(envelope));
}

export type LoadResult =
  | { ok: true; world: World }
  | { ok: false; reason: string };

export function load(store: SaveStore, name: string): LoadResult {
  const raw = store.get(PREFIX + name);
  if (raw === null) {
    // The original's message 4: "No SAVE has been performed so there is no DATA
    // to LOAD!"
    return { ok: false, reason: "no-such-slot" };
  }
  let envelope: SaveEnvelope;
  try {
    envelope = JSON.parse(raw) as SaveEnvelope;
  } catch {
    return { ok: false, reason: "corrupt" };
  }
  if (envelope.format !== FORMAT) {
    return { ok: false, reason: `unsupported save format ${envelope.format}` };
  }
  if (
    typeof envelope.world?.room !== "number" ||
    typeof envelope.world?.objects !== "object"
  ) {
    return { ok: false, reason: "corrupt" };
  }
  return { ok: true, world: envelope.world };
}

export function listSaves(store: SaveStore): SaveSlotInfo[] {
  const out: SaveSlotInfo[] = [];
  for (const key of store.keys()) {
    if (!key.startsWith(PREFIX)) continue;
    const raw = store.get(key);
    if (!raw) continue;
    try {
      const envelope = JSON.parse(raw) as SaveEnvelope;
      out.push({
        name: key.slice(PREFIX.length),
        savedAt: envelope.savedAt,
        room: envelope.world.room,
        turn: envelope.world.turn,
      });
    } catch {
      // A corrupt slot should not hide the healthy ones.
    }
  }
  return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function remove(store: SaveStore, name: string): void {
  store.remove(PREFIX + name);
}
