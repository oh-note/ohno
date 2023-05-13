import { PluginComponent } from "@/system/page";
// import {} from "./handler";
import { InlineSupport } from "./plugin";
import { InlineSupportPluginHandler } from "./handler";

export function InlineSupportPlugin(): PluginComponent {
  const manager = new InlineSupport();
  return {
    manager: manager,
    handlers: {
      plugins: new InlineSupportPluginHandler({}),
    },
  };
}
