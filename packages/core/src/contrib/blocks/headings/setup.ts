import { BlockCreate, SlashMenu } from "@ohno-editor/core/index";
import { Page } from "@ohno-editor/core/system";
import { Headings } from "./";
import { HeadingLevel } from "./block";
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
