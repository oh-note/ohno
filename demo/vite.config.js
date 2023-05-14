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
  plugins: [
    // {
    //   name: "resolve-logger",
    //   resolveId(source) {
    //     console.log("Resolving:", source);
    //     const match = /^@\/(.*)$/.exec(source);
    //     if (match) {
    //       const filePath = path.resolve(
    //         __dirname,
    //         "../packages/core/src/",
    //         match[1]
    //       );
    //       console.log("Resolved to:", filePath);
    //       return filePath;
    //     }
    //     return null; // Let Vite handle all other modules
    //   },
    // },
  ],
  test: {
    // environment: "happy-dom",
    environment: "jsdom",
    // environment: "edge-runtime",
  },
});
