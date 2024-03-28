import { PluginComponent } from "@ohno/core/system/types";
// import {} from "./handler";
import { Example } from "./plugin";
import { ExamplePluginHandler } from "./handler";

export { Example, ExamplePluginHandler };
export function ExamplePlugin(): PluginComponent {
  const manager = new Example();
  return {
    manager: manager,
    handlers: {
      plugins: new ExamplePluginHandler(),
    },
  };
}
