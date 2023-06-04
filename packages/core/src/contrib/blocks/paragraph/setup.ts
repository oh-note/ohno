import { BlockCreate, Paragraph, SlashMenu } from "@ohno-editor/core/index";
import { Page } from "@ohno-editor/core/system";

export function setupSlashMenu(page: Page) {
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
}
