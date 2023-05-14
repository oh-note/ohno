import { BlockComponent } from "@ohno-editor/core/system/page";
import { Figure } from "./block";
import { FigureHandler } from "./handler";

export { Figure, FigureHandler };
export function FigureBlock(): BlockComponent {
  return {
    name: "figure",
    blockType: Figure,
    handlers: {
      blocks: { figure: new FigureHandler() },
    },
  };
}
