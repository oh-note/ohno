import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { Code, CodeSerializer } from "./block";
import { CodeHandler } from "./handler";
import { setupPasteAll, setupSlashMenu } from "./setup";

export { Code, CodeHandler };
export function CodeBlock(): BlockComponent {
  return {
    name: "code",
    blockType: Code,
    handlers: {
      blocks: { code: new CodeHandler() },
    },
    onPageCreated: (page) => {
      setupPasteAll(page);
      setupSlashMenu(page);
    },
    serializer: new CodeSerializer(),
  };
}
