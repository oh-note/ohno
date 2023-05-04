import { BlockComponent, HandlerEntry } from "@/system/page";
import { Code } from "./block";
import { CodeHandler } from "./handler";

export * from "./handler";
export * from "./block";

export function CodeBlock(): BlockComponent {
  return {
    blockType: Code,
    handlers: {
      blocks: { code: new CodeHandler() },
    },
  };
}
