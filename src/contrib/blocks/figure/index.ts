import { BlockComponent, HandlerEntry } from "@/system/page";
import { Figure } from "./block";
import { FigureHandler } from "./handler";
export * from "./handler";
export * from "./block";

export function FigureBlock(): BlockComponent {
  return {
    name: "figure",
    blockType: Figure,
    handlers: {
      blocks: { figure: new FigureHandler() },
    },
  };
}
