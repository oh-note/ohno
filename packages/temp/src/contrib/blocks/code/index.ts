import { BlockComponent } from "@ohno/core/system/types";
import { Code, CodeSerializer } from "./block";
import { CodeHandler } from "./handler";
import { setupPasteAll, setupSlashMenu } from "./setup";
import { CodeCommandSet } from "./command_set";

export { Code, CodeHandler };
export function CodeBlock(): BlockComponent<Code> {
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
    commandSet: new CodeCommandSet(),
  };
}
