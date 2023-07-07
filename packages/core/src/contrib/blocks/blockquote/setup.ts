import { BlockCreate, BlockQuote, SlashMenu } from "@ohno-editor/core/index";
import { Page } from "@ohno-editor/core/system";

export function setupSlashMenu(page: Page) {
  const slashmenu = page.getPlugin<SlashMenu>("slashmenu");

  slashmenu.addOption({
    static: {
      name: `Blockquote`,
    },
    filter: `Blockquote`,
    onSelect: (context) => {
      const { page, block } = context;
      const newBlock = new BlockQuote();
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
