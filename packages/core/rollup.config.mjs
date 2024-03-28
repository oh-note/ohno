// @ts-check
import svg from "rollup-plugin-svg-import";
import css from "rollup-plugin-import-css";

// export default {
//     input: "index.js",
//     output: { file: "dist/index.js", format: "esm" },
//     plugins: [ css() ]
// };
import { defineRollupConfig } from "config";

export default defineRollupConfig({
  input: [
    {
      name: "core",
      path: "./src/index.ts",
      globalVariableName: "FloatingUICore",
    },
  ],
  globals: {
    "@ohno/core": "OhnoCore",
  },
  outputs: {
    cjs: false,
    umd: { globals: {} },
    browser: { globals: {} },
  },
  plugins: [
    css(),
    svg({
      /**
       * If `true`, instructs the plugin to import an SVG as string.
       * For example, for Server Side Rendering.
       * Otherwise, the plugin imports SVG as DOM node.
       */
      stringify: true,
    }),
  ],
});
