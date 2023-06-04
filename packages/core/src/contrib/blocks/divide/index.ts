import { BlockComponent } from "@ohno-editor/core/system/page";
import { Divide, FigureSerializer } from "./block";
import { DivideHandler } from "./handler";

export { Divide, DivideHandler };
export function DivideBlock(): BlockComponent {
  return {
    name: "divide",
    blockType: Divide,
    handlers: {
      blocks: { divide: new DivideHandler() },
    },
    serializer: new FigureSerializer(),
  };
}
