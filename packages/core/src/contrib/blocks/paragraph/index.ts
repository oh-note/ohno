import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { ParagraphHandler } from "./handler";
import { Paragraph, ParagraphSerializer } from "./block";
import { SlashMenu } from "@ohno-editor/core/contrib/plugins/slashmenu/plugin";
import { BlockCreate } from "@ohno-editor/core/contrib/commands/block";
import { setupSlashMenu } from "./setup";
export { prepareDeleteCommand, prepareEnterCommand } from "./handler";
export { Paragraph, ParagraphHandler };
export function ParagraphBlock(): BlockComponent {
  return {
    name: "paragraph",
    blockType: Paragraph,
    handlers: {
      blocks: { paragraph: new ParagraphHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
    },
    serializer: new ParagraphSerializer(),
  };
}
