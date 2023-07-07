import { BlockComponent } from "@ohno-editor/core/system/types";
import { BlockQuoteHandler } from "./handler";
import { BlockQuote, BlockquoteSerializer } from "./block";
import { setupSlashMenu } from "./setup";
import { BlockquoteCommandSet } from "./command_set";

export { BlockQuoteHandler, BlockQuote };

export function BlockQuoteBlock(): BlockComponent<BlockQuote> {
  return {
    name: "blockquote",
    blockType: BlockQuote,
    handlers: {
      blocks: { blockquote: new BlockQuoteHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
    },
    serializer: new BlockquoteSerializer(),
    commandSet: new BlockquoteCommandSet(),
  };
}
