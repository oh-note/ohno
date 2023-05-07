import { PluginComponent } from "@/system/page";
// import {} from "./handler";
import { Example } from "./plugin";
import { ExamplePluginHandler } from "./handler";

export function ExamplePlugin(): PluginComponent {
  const manager = new Example();
  return {
    manager: manager,
    handlers: {
      plugins: new ExamplePluginHandler({}),
    },
  };
}
