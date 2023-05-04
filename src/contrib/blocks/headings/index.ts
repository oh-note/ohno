import { BlockComponent } from "@/system/page";
import { Headings } from "./block";
import { HeadingsHandler } from "./handler";

export * from "./handler";
export * from "./block";

export function HeadingsBlock(): BlockComponent {
  return {
    blockType: Headings,
    handlers: {
      blocks: { headings: new HeadingsHandler() },
    },
  };
}
