import { InlineComponent } from "@ohno-editor/core/system/page";
import { FlagHandler } from "./handler";
import { Flag, FlagInit, FlagPayload } from "./inline";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";

export { Flag, FlagHandler };
export function FlagInline(init: FlagInit): InlineComponent {
  const instance = new Flag(init);
  const handler = new FlagHandler();
  return {
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
  };
}
