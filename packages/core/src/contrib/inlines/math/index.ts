import { InlineComponent } from "@/system/page";
import { InlineMathHandler } from "./handler";
import { KatexMath, Option } from "./inline";
import { InlineSupport } from "@/contrib/plugins/inlineSupport/plugin";

export function KatexMathInline(): InlineComponent {
  const instance = new KatexMath();
  const handler = new InlineMathHandler();
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
