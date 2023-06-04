import { BlockComponent } from "@ohno-editor/core/system/page";
import { BlockQuoteHandler } from "./handler";
import { Blockquote, BlockquoteSerializer } from "./block";
import { setupSlashMenu } from "./setup";

export { BlockQuoteHandler, Blockquote };

export function BlockQuoteBlock(): BlockComponent {
  return {
    name: "blockquote",
    blockType: Blockquote,
    handlers: {
      blocks: { blockquote: new BlockQuoteHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
    },
    serializer: new BlockquoteSerializer(),
  };
}
