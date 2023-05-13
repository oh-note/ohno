import { BlockComponent } from "@/system/page";
import { HeadingLevel, Headings } from "./block";
import { HeadingsHandler } from "./handler";
import { SlashMenu } from "@/contrib/plugins/slashmenu/plugin";
import { BlockCreate } from "@/contrib/commands/block";

export * from "./handler";
export * from "./block";

export function HeadingsBlock(): BlockComponent {
  return {
    name: "headings",
    blockType: Headings,
    handlers: {
      blocks: { headings: new HeadingsHandler() },
    },
    onPageCreated: (page) => {
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
    },
  };
}
