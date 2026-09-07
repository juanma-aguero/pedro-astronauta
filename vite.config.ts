import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    // Phaser is a large single dependency; code-splitting it adds no value here.
    chunkSizeWarningLimit: 1500,
  },
});
