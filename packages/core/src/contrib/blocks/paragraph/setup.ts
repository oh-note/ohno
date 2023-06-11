import {
  BlockCreate,
  Paragraph,
  PasteAll,
  SlashMenu,
} from "@ohno-editor/core/index";
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

export function setupPasteAll(page: Page) {
  const pasteall = page.getPlugin<PasteAll>("pasteall");
  if (pasteall) {
    pasteall.registerNodeParser("p", (p: Node) => {
      return {
        data: [
          {
            type: "paragraph",
            data: {
              children: (p as HTMLElement).innerHTML,
            },
          },
        ],
      };
    });
  }
}
