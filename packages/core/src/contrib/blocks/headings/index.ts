import { BlockComponent } from "@ohno-editor/core/system/page";
import { HeadingLevel, Headings, HeadingsSerializer } from "./block";
import { HeadingsHandler } from "./handler";
import { SlashMenu } from "@ohno-editor/core/contrib/plugins/slashmenu/plugin";
import { BlockCreate } from "@ohno-editor/core/contrib/commands/block";
import { setupPasteAll, setupSlashMenu } from "./setup";

export { Headings, HeadingsHandler };
export function HeadingsBlock(): BlockComponent {
  return {
    name: "headings",
    blockType: Headings,
    handlers: {
      blocks: { headings: new HeadingsHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
      setupPasteAll(page);
    },
    serializer: new HeadingsSerializer(),
  };
}
