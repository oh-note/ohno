import { BlockComponent } from "@/system/page";
import { BlockQuoteHandler } from "./handler";
import { Blockquote } from "./block";

export * from "./handler";
export * from "./block";

export function BlockQuoteBlock(): BlockComponent {
  return {
    blockType: Blockquote,
    handlers: {
      blocks: { blockquote: new BlockQuoteHandler() },
    },
  };
}
