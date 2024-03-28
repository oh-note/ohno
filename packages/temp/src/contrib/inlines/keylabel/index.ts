import { InlineComponent } from "@ohno/core/system/types";
import { KeyLabelHandler } from "./handler";
import { KeyLabel, KeyLabelSerializer } from "./inline";
import { InlineSupport } from "@ohno/core/system/inline";

export { KeyLabel, KeyLabelHandler };
export function KeyLabelInline(): InlineComponent {
  const instance = new KeyLabel();
  const handler = new KeyLabelHandler();
  return {
    name: "keylabel",
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
    serializer: new KeyLabelSerializer(instance),
  };
}
