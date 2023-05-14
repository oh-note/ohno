import { PluginComponent } from "@ohno-editor/core/system/page";
// import {} from "./handler";
import { Placeholder } from "./plugin";
import { PlaceholaderHandler } from "./handler";

export { PlaceholaderHandler, Placeholder };
export function PlaceholderPlugin(): PluginComponent {
  const manager = new Placeholder();
  return {
    manager: manager,
    handlers: {
      plugins: new PlaceholaderHandler({}),
    },
  };
}
