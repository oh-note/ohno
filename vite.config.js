import { defineConfig } from "vite";

import { builtinEnvironments, populateGlobal } from 'vitest/environments'

console.log(builtinEnvironments) // { jsdom, happy-dom, node, edge-runtime }

export default defineConfig({
  // ...
  test: {
    // environment: "happy-dom",
    environment: "jsdom",
    // environment: "edge-runtime",
    
  },
});

