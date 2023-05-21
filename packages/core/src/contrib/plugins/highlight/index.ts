import { PluginComponent } from "@ohno-editor/core/system/page";
// import {} from "./handler";
import { Highlight } from "./plugin";
import { HighlightPluginHandler } from "./handler";

export {
  Highlight as InlineSupport,
  HighlightPluginHandler as InlineSupportPluginHandler,
};
export function InlineSupportPlugin(): PluginComponent {
  const manager = new Highlight();
  return {
    manager: manager,
    handlers: {
      plugins: new HighlightPluginHandler({}),
    },
  };
}
