import {
  BlockCreate,
  PasteAll,
  SlashMenu,
  getTagName,
} from "../../../index";
import { BlockSerializedData, Page } from "../../../system";
import { Code } from "./";
import { CodeData } from "./block";

export function setupSlashMenu(page: Page) {
  const slashmenu = page.getPlugin<SlashMenu>("slashmenu");
  if (slashmenu) {
    slashmenu.addOption({
      static: {
        name: `Code`,
      },
      filter: `Code`,
      onSelect: (context) => {
        const { page, block } = context;
        const newBlock = new Code({});
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
            type: "code",
            data: { code: (h as HTMLElement).textContent },
          } as BlockSerializedData<CodeData>,
        ],
      };
    };

    pasteall.registerNodeParser("pre", parser);
  }
}
