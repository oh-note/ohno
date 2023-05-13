import { PluginComponent } from "@/system/page";
// import {} from "./handler";
import { Placeholder } from "./plugin";
import { PlaceholaderHandler } from "./handler";

export function PlaceholderPlugin(): PluginComponent {
  const manager = new Placeholder();
  return {
    manager: manager,
    handlers: {
      plugins: new PlaceholaderHandler({}),
    },
  };
}
