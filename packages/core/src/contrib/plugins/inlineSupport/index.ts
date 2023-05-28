import { PluginComponent } from "@ohno-editor/core/system/page";
// import {} from "./handler";
import { InlineSupport } from "./plugin";
import { InlineSupportPluginHandler } from "./handler";

export { InlineSupport, InlineSupportPluginHandler };
export function InlineSupportPlugin(): PluginComponent {
  const manager = new InlineSupport();
  return {
    manager: manager,
    handlers: {
      plugins: new InlineSupportPluginHandler(),
    },
  };
}
