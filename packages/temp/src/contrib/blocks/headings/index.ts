import { BlockComponent } from "@ohno/core/system/types";
import { Headings, HeadingsSerializer } from "./block";
import { HeadingsHandler } from "./handler";
import { setupPasteAll, setupSlashMenu } from "./setup";
import { HeadingsCommandSet } from "./command_set";

export { Headings, HeadingsHandler };
export function HeadingsBlock(): BlockComponent<Headings> {
  return {
    name: "headings",
    blockType: Headings,
    handlers: {
      blocks: { headings: new HeadingsHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
      setupPasteAll(page);
    },
    serializer: new HeadingsSerializer(),
    commandSet: new HeadingsCommandSet(),
  };
}
