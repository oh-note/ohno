import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { Code } from "./block";
import { CodeHandler } from "./handler";

export { Code, CodeHandler };
export function CodeBlock(): BlockComponent {
  return {
    name: "code",
    blockType: Code,
    handlers: {
      blocks: { code: new CodeHandler() },
    },
  };
}
