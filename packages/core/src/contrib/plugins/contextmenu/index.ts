import { PluginComponent } from "@ohno-editor/core/system/page";
import { ContextMenu } from "./plugin";
import { ContextMenuHandler } from "./handler";

export { ContextMenu, ContextMenuHandler };
export function ContextMenuPlugin(): PluginComponent {
  const manager = new ContextMenu();
  return {
    manager: manager,
    handlers: {
      plugins: new ContextMenuHandler(),
    },
  };
}
