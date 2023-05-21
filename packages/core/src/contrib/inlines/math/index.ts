import { InlineComponent } from "@ohno-editor/core/system/page";
import { InlineMathHandler } from "./handler";
import { KatexMath, Option } from "./inline";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";

export { KatexMath };
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
