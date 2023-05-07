import { PluginComponent } from "@/system/page";
// import {} from "./handler";
import { Dragable } from "./plugin";
import { DragablePluginHandler } from "./handler";

export function DragablePlugin(): PluginComponent {
  const manager = new Dragable();
  return {
    manager: manager,
    handlers: {
      plugins: new DragablePluginHandler({}),
    },
  };
}
