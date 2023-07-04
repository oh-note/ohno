import { defineConfig } from "vite";
import path, { resolve } from "path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";

export const isDev = process.env.__DEV__ === "true";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../packages/core/src/"),
      "@ohno-editor/core": path.resolve(__dirname, "../packages/core/src/"),
    },
  },
  plugins: [{ enforce: "pre", ...mdx() }, react()],
});
