/**
 * Build a single self-contained HTML file from the Vite output.
 *
 * The point is a version anyone can open without a toolchain or a server:
 * script, styles and all 42 pictures inlined, no requests to anywhere. That also
 * makes it publishable as an Artifact, where a strict CSP blocks external hosts.
 *
 *   node tools/build_standalone.mjs
 *
 * Writes:
 *   dist-standalone/standalone.html  a complete page -- open it from disk
 *   dist-standalone/artifact.html    the same, minus <html>/<head>/<body>,
 *                                    which the Artifact host supplies itself
 *
 * Run `npx vite build --config vite.standalone.config.ts` first.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist-standalone");

if (!existsSync(resolve(DIST, "index.html"))) {
  console.error(
    "dist-standalone/index.html not found -- run\n" +
      "  npx vite build --config vite.standalone.config.ts",
  );
  process.exit(1);
}

const html = readFileSync(resolve(DIST, "index.html"), "utf8");

/* ------------------------------------------------------------------ assets -- */

function assetText(match, kind) {
  if (!match) throw new Error(`no ${kind} asset found in the standalone build`);
  const file = resolve(DIST, match.replace(/^\.?\//, ""));
  return readFileSync(file, "utf8");
}

const script = assetText(
  /<script[^>]*src="([^"]+)"[^>]*>/.exec(html)?.[1],
  "script",
);
const styles = assetText(
  /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/.exec(html)?.[1],
  "stylesheet",
);

/** Every picture, as filename -> data URI. */
function inlineImages() {
  const dir = resolve(DIST, "images");
  const map = {};
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".svg")) continue;
    const svg = readFileSync(resolve(dir, name), "utf8");
    map[name] = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return map;
}

const images = inlineImages();

/* -------------------------------------------------------------------- body -- */

const body = /<body>([\s\S]*?)<\/body>/.exec(html)?.[1] ?? "";
const markup = body.replace(/<script[\s\S]*?<\/script>/g, "").trim();

/**
 * `</script>` inside a string literal would close the inline script tag early,
 * so the JSON is escaped before it goes in.
 */
const imageJson = JSON.stringify(images).replace(/<\//g, "<\\/");

const inlined = [
  `<style>\n${styles}\n</style>`,
  markup,
  `<script>window.__RED_DOOR_IMAGES__ = ${imageJson};</script>`,
  `<script type="module">\n${script}\n</script>`,
].join("\n\n");

// The Artifact host supplies <head>, but a <title> in the fragment still names
// the browser tab and the gallery card.
writeFileSync(
  resolve(DIST, "artifact.html"),
  `<title>The Red Door</title>\n\n${inlined}\n`,
);

writeFileSync(
  resolve(DIST, "standalone.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>The Red Door</title>
    <meta
      name="description"
      content="A remake of The Red Door, a 1985 ZX Spectrum text adventure by Tartan Software."
    />
  </head>
  <body>
${inlined}
  </body>
</html>
`,
);

const kb = (s) => `${Math.round(s / 1024)} kB`;
console.log(
  `standalone.html  ${kb(inlined.length + 400)}  ` +
    `(${Object.keys(images).length} pictures inlined)`,
);
console.log(`artifact.html    ${kb(inlined.length)}`);
