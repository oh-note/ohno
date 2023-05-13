import { BlockComponent, HandlerEntry } from "@/system/page";
import { Equation } from "./block";
import { EquationHandler } from "./handler";

export * from "./handler";
export * from "./block";

export function EquationBlock(): BlockComponent {
  return {
    name: "equation",
    blockType: Equation,
    handlers: {
      blocks: { equation: new EquationHandler() },
    },
  };
}
