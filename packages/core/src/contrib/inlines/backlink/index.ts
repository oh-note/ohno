import { InlineComponent } from "@ohno-editor/core/system/page";
import { BackLinkHandler } from "./handler";
import { BackLink, BackLinkInit, BackLinkOption } from "./inline";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";

export { BackLink, BackLinkHandler };
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
