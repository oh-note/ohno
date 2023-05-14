import { PluginComponent } from "@ohno-editor/core/system/page";
// import {} from "./handler";
import { SlashMenu } from "./plugin";
import { SlashMenuHandler } from "./handler";

export { SlashMenu, SlashMenuHandler };
export function SlashMenuPlugin(): PluginComponent {
  const manager = new SlashMenu();
  return {
    manager: manager,
    handlers: {
      plugins: new SlashMenuHandler(),
    },
  };
}
