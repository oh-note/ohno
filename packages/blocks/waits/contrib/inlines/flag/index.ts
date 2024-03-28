import { InlineComponent } from "../../../system/types";
import { FlagHandler } from "./handler";
import { Flag, FlagInit, FlagPayload } from "./inline";
import { InlineSupport } from "../../../system/inline";

export { Flag, FlagHandler };
export function FlagInline(init: FlagInit): InlineComponent {
  const instance = new Flag(init);
  const handler = new FlagHandler();
  return {
    name: "flag",
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
  };
}
