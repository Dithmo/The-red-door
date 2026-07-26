import { defineConfig } from "vite";

/**
 * Build for the single-file version.
 *
 * The normal build has two entry points (the game and the review harness), so
 * Rollup splits the code they share into its own chunk. That chunk cannot be
 * fetched from a `file://` page or from inside an Artifact, so the standalone
 * build takes the game alone and forces everything into one chunk that can be
 * inlined whole.
 */
export default defineConfig({
  base: "./",
  publicDir: "assets",
  build: {
    outDir: "dist-standalone",
    target: "es2022",
    rollupOptions: {
      input: "index.html",
      output: { inlineDynamicImports: true },
    },
  },
});
