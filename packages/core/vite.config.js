import { defineConfig } from "vite";
import path, { resolve } from "path";
import { builtinEnvironments, populateGlobal } from "vitest/environments";
import svgr from "vite-plugin-svgr";

const root = resolve(__dirname, "src/");
export const isDev = process.env.__DEV__ === "true";

export default defineConfig({
  plugins: [svgr({ svgrOptions: { icon: true } })],
  // alias: {
  //   "@": path.resolve(__dirname, "../packages/core/src/"),
  //   "@ohno-editor/core": path.resolve(__dirname, "../packages/core/src/"),
  // },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@ohno-editor/core": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // environment: "happy-dom",
    environment: "jsdom",
    // environment: "edge-runtime",
  },
});
