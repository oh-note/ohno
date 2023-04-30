import { BlockEntry, HandlerEntry } from "@/system/page";
import { CodeHandler } from "./handler";
import { Code } from "./block";

export * from "./handler";
export * from "./block";

export const CodeHandlers: HandlerEntry = {
  blockHandler: new CodeHandler(),
};

export const CodeBlockEntry: BlockEntry = {
  name: "code",
  blockType: Code,
  handler: new CodeHandler(),
};
