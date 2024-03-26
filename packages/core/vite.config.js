import { defineConfig } from "vite";
import path, { resolve } from "path";

// const root = resolve(__dirname, "src/");
export const isDev = process.env.__DEV__ === "true";

const htmlImport = {
  // refer to https://stackoverflow.com/questions/67330947/vite-cannot-handle-xxx-html-files
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
      code = `export default \`${code}\``;
    }
    return { code };
  },
};

export default defineConfig({
  plugins: [htmlImport],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@ohno-editor/core": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "ohno-core",
      // the proper extensions will be added
      fileName: "ohno",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      // external: ["vue"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        // globals: {
        //   vue: "Vue",
        // },
      },
    },
  },
});
