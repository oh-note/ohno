import { InlineComponent } from "@ohno-editor/core/system/types";
import { InlineMathHandler } from "./handler";
import { KatexMath } from "./inline";
import { InlineSupport } from "@ohno-editor/core/system/inline";

export { KatexMath };
export function KatexMathInline(): InlineComponent {
  const instance = new KatexMath();
  const handler = new InlineMathHandler();
  return {
    name: "math",
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
    // serializer
  };
}
