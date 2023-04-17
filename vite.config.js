import { defineConfig } from "vite";
import path, { resolve } from "path";
import { builtinEnvironments, populateGlobal } from "vitest/environments";

const root = resolve(__dirname, "src/");
export const isDev = process.env.__DEV__ === "true";

export default defineConfig({
  plugins: [],
  resolve: {
    // alias: [
    //   {
    //     find: /^@(.+)/,
    //     replacement: (match, p1) => path.resolve(__dirname, "src", p1),
    //   },
    // ],

    alias: {
      "@": "src/",
      "@helper": resolve(root, "helper"),
      "@struct": resolve(root, "struct"),
      "@system": resolve(root, "system"),
      "@contrib": resolve(root, "contrib"),
    },
  },
  test: {
    // environment: "happy-dom",
    environment: "jsdom",
    // environment: "edge-runtime",
  },
});
