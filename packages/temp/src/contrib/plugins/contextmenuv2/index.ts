import { PluginComponent } from "@ohno/core/system/types";
import { ContextMenu } from "./plugin";

export { ContextMenu };
export function ContextMenuPlugin(): PluginComponent {
  const manager = new ContextMenu();
  return {
    manager: manager,
    handlers: {
      plugins: manager, // class ContextMenu implements PagesHandlerMethods interface
    },
  };
}
