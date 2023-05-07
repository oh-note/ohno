import { PluginComponent } from "@/system/page";
// import {} from "./handler";
import { Toolbar } from "./plugin";
import { ToolbarPluginHandler } from "./handler";

export function ToolbarPlugin(): PluginComponent {
  const manager = new Toolbar();
  return {
    manager: manager,
    handlers: {
      plugins: new ToolbarPluginHandler({}),
    },
  };
}
