import { PluginComponent } from "@ohno-editor/core/system/types";
// import {} from "./handler";
import { Dragable } from "./plugin";
import { DragablePluginHandler } from "./handler";

export { Dragable, DragablePluginHandler };
export function DragablePlugin(): PluginComponent {
  const manager = new Dragable();
  return {
    manager: manager,
    handlers: {
      plugins: new DragablePluginHandler(),
    },
  };
}
