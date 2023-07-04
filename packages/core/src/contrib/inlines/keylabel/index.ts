import { InlineComponent } from "@ohno-editor/core/system/page";
import { KeyLabelHandler } from "./handler";
import { KeyLabel, KeyLabelSerializer } from "./inline";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";

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
