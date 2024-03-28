import { BlockComponent } from "../../../system/types";
import { Figure, FigureSerializer } from "./block";
import { FigureHandler } from "./handler";
import { FigureCommandSet } from "./command_set";

export { Figure, FigureHandler };
export function FigureBlock(): BlockComponent<Figure> {
  return {
    name: "figure",
    blockType: Figure,
    handlers: {
      blocks: { figure: new FigureHandler() },
    },
    serializer: new FigureSerializer(),
    commandSet: new FigureCommandSet(),
  };
}
