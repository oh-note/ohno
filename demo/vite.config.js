import { defineConfig } from "vite";
import path, { resolve } from "path";

const root = resolve(__dirname, "src/");
export const isDev = process.env.__DEV__ === "true";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../packages/core/src/"),
      "@ohno-editor/core": path.resolve(__dirname, "../packages/core/src/"),
    },
  },
  plugins: [],
  test: {
    // environment: "happy-dom",
    environment: "jsdom",
    // environment: "edge-runtime",
  },
});
