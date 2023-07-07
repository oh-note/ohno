import { BlockCreate, PasteAll, SlashMenu } from "@ohno-editor/core/contrib";
import { Page } from "@ohno-editor/core/system/types";
import { Headings } from "./";
import { HeadingLevel } from "./block";
import { getTagName } from "@ohno-editor/core/system/functional";
export function setupSlashMenu(page: Page) {
  const slashmenu = page.getPlugin<SlashMenu>("slashmenu");
  if (slashmenu) {
    Array(5)
      .fill(0)
      .forEach((_, index) => {
        index++;

        slashmenu.addOption({
          static: {
            name: `Heading ${index}`,
          },
          filter: `Heading ${index}`,
          onSelect: (context) => {
            const { page, block } = context;
            const newBlock = new Headings({ level: index as HeadingLevel });
            const command = new BlockCreate({
              page,
              block,
              newBlock,
              where: "after",
            });
            return command;
          },
        });
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
            type: "headings",
            data: {
              level: parseInt(getTagName(h)[1]),
              children: (h as HTMLElement).innerHTML,
            },
          },
        ],
      };
    };

    pasteall.registerNodeParser("h1", parser);
    pasteall.registerNodeParser("h2", parser);
    pasteall.registerNodeParser("h3", parser);
    pasteall.registerNodeParser("h4", parser);
    pasteall.registerNodeParser("h5", parser);
  }
}
