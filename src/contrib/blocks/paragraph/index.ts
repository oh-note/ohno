import { BlockComponent, HandlerEntry } from "@/system/page";
import { ParagraphHandler } from "./handler";
import { Paragraph } from "./block";

export * from "./handler";
export * from "./block";

export function ParagraphBlock(): BlockComponent {
  return {
    blockType: Paragraph,
    handlers: {
      blocks: { paragraph: new ParagraphHandler() },
    },
  };
}
