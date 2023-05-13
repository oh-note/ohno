import { InlineComponent } from "@/system/page";
import { BackLinkHandler } from "./handler";
import { BackLink, BackLinkInit, BackLinkOption } from "./inline";
import { InlineSupport } from "@/contrib/plugins/inlineSupport/plugin";

export function BackLinkInline(init: BackLinkInit): InlineComponent {
  const instance = new BackLink(init);
  const handler = new BackLinkHandler();
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
