import { BlockComponent, HandlerEntry } from "@/system/page";
import { ParagraphHandler } from "./handler";
import { Paragraph } from "./block";
import { SlashMenu } from "@/contrib/plugins/slashmenu/plugin";
import { BlockCreate } from "@/contrib/commands/block";

export * from "./handler";
export * from "./block";

export function ParagraphBlock(): BlockComponent {
  return {
    name: "paragraph",
    blockType: Paragraph,
    handlers: {
      blocks: { paragraph: new ParagraphHandler() },
    },
    onPageCreated: (page) => {
      const slashmenu = page.getPlugin<SlashMenu>("slashmenu");
      if (slashmenu) {
        slashmenu.addOption({
          static: {
            name: "paragraph",
          },
          filter: "paragraph",
          onSelect: (context) => {
            const { page, block } = context;
            const newBlock = new Paragraph();
            const command = new BlockCreate({
              page,
              block,
              newBlock,
              where: "after",
            });
            return command;
          },
        });
      }
    },
  };
}
