import { PluginComponent } from "@ohno-editor/core/system/page";
import { PasteAll } from "./plugin";
import { PasteAllPluginHandler } from "./handler";

export { PasteAll, PasteAllPluginHandler };
export function PasteAllPlugin(): PluginComponent {
  const manager = new PasteAll();
  return {
    manager: manager,
    handlers: {
      plugins: new PasteAllPluginHandler(),
    },
  };
}
