import { BlockComponent } from "@ohno-editor/core/system/page";
import { BlockQuoteHandler } from "./handler";
import { Blockquote } from "./block";

export { BlockQuoteHandler, Blockquote };

export function BlockQuoteBlock(): BlockComponent {
  return {
    name: "blockquote",
    blockType: Blockquote,
    handlers: {
      blocks: { blockquote: new BlockQuoteHandler() },
    },
  };
}
