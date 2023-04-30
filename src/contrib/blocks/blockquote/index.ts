import { BlockEntry, HandlerEntry } from "@/system/page";
import { BlockQuoteHandler } from "./handler";
import { Blockquote } from "./block";

export * from "./handler";
export * from "./block";

export const BlockquoteHandlers: HandlerEntry = {
  blockHandler: new BlockQuoteHandler(),
};

export const BlockquoteBlockEntry: BlockEntry = {
  name: "blockquote",
  blockType: Blockquote,
  handler: new BlockQuoteHandler(),
};
