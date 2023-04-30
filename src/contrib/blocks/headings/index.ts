export * from "./handler";
import { BlockEntry, HandlerEntry } from "@/system/page";
import { HeadingsHandler } from "./handler";
import { Headings } from "./block";

export * from "./handler";
export * from "./block";

export const HeadingHandlers: HandlerEntry = {
  blockHandler: new HeadingsHandler(),
};

export const HeadingsBlockEntry: BlockEntry = {
  name: "headings",
  blockType: Headings,
  handler: new HeadingsHandler(),
};
