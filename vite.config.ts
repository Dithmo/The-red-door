import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "assets",
  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: {
      input: {
        // The game.
        main: "index.html",
        // The data-review harness: every room, its flags, and its pictures.
        review: "review.html",
      },
    },
  },
});
