import { InlineComponent } from "@ohno/core/system/types";
import { BackLinkHandler } from "./handler";
import { BackLink, BackLinkInit } from "./inline";
import { InlineSupport } from "@ohno/core/system/inline";

export { BackLink, BackLinkHandler };
export function BackLinkInline(init: BackLinkInit): InlineComponent {
  const instance = new BackLink(init);
  const handler = new BackLinkHandler();
  return {
    name: "backlink",
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
  };
}
