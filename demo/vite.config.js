import { defineConfig } from "vite";
import path, { resolve } from "path";

const root = resolve(__dirname, "src/");
export const isDev = process.env.__DEV__ === "true";

const htmlImport = {
  // refer to https://stackoverflow.com/questions/67330947/vite-cannot-handle-xxx-html-files
  // has problem when build
  name: "htmlImport",
  /**
   * Checks to ensure that a html file is being imported.
   * If it is then it alters the code being passed as being a string being exported by default.
   * @param {string} code The file as a string.
   * @param {string} id The absolute path.
   * @returns {{code: string}}
   */
  transform(code, id) {
    if (/^.*\.html$/g.test(id) || /^.*\.svg$/g.test(id)) {
      code = `export default \`${code}\`;`;
    }
    return { code };
  },
};

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
