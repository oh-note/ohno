import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { Equation } from "./block";
import { EquationHandler } from "./handler";

export { Equation, EquationHandler };
export function EquationBlock(): BlockComponent {
  return {
    name: "equation",
    blockType: Equation,
    handlers: {
      blocks: { equation: new EquationHandler() },
    },
  };
}
