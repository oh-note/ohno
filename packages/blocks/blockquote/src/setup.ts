import { BlockQuote } from "./index";
import { BlockCreate, SlashMenu } from "@ohno/core/contrib";

import { Page } from "@ohno/core/system";

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
