import { BlockEntry, HandlerEntry } from "@/system/page";
import { ParagraphHandler } from "./handler";
import { Paragraph } from "./block";

export * from "./handler";
export * from "./block";

export const ParagraphHandlers: HandlerEntry = {
  blockHandler: new ParagraphHandler(),
};

export const ParagraphBlockEntry: BlockEntry = {
  name: "paragraph",
  blockType: Paragraph,
  handler: new ParagraphHandler(),
};
