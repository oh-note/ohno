import { BlockComponent } from "@ohno-editor/core/system/types";
import { Divide, FigureSerializer } from "./block";
import { DivideHandler } from "./handler";
import { DivideCommandSet } from "./command_set";

export { Divide, DivideHandler };
export function DivideBlock(): BlockComponent {
  return {
    name: "divide",
    blockType: Divide,
    handlers: {
      blocks: { divide: new DivideHandler() },
    },
    serializer: new FigureSerializer(),
    commandSet: new DivideCommandSet(),
  };
}
