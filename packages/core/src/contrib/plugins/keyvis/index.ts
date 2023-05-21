import { PluginComponent } from "@ohno-editor/core/system/page";

import { KeyVis } from "./plugin";
import { KeyVisPluginHandler } from "./handler";

export { KeyVis, KeyVisPluginHandler };
export function KeyVisPlugin(): PluginComponent {
  const manager = new KeyVis();
  return {
    manager: manager,
    handlers: {
      plugins: new KeyVisPluginHandler({}),
    },
  };
}
