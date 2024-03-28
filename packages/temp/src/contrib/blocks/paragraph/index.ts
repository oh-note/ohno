import { BlockComponent } from "@ohno/core/system/types";
import { ParagraphHandler } from "./handler";
import { Paragraph, ParagraphSerializer } from "./block";

import { setupPasteAll, setupSlashMenu } from "./setup";
import { ParagraphCommandSet } from "./command_set";
export { prepareDeleteCommand, prepareEnterCommand } from "./handler";
export { Paragraph, ParagraphHandler };
export function ParagraphBlock(isDefault: boolean = true): BlockComponent {
  return {
    name: "paragraph",
    blockType: Paragraph,
    isDefault,
    handlers: {
      blocks: { paragraph: new ParagraphHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
      setupPasteAll(page);
    },
    serializer: new ParagraphSerializer(),
    commandSet: new ParagraphCommandSet(),
  };
}
