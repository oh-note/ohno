import { BlockCreate, PasteAll, SlashMenu } from "../../../index";
import { Page } from "../../../system/types";
import { List } from "./";

export function setupSlashMenu(page: Page) {
  const slashmenu = page.getPlugin<SlashMenu>("slashmenu");
  if (slashmenu) {
    slashmenu.addOption({
      static: {
        name: `List`,
      },
      filter: `List`,
      onSelect: (context) => {
        const { page, block } = context;
        const newBlock = new List({ children: [] });
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
    const parser = (h: Node) => {
      return {
        data: [
          {
            type: "list",
            data: {
              children: Array.from(
                (h as HTMLElement).querySelectorAll("li")
              ).map((item) => item.innerHTML),
            },
          },
        ],
      };
    };

    pasteall.registerNodeParser("ul", parser);
  }
}
