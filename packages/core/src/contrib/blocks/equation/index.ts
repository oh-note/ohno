import { BlockComponent } from "@ohno-editor/core/system/types";
import { Equation, EquationSerializer } from "./block";
import { EquationHandler } from "./handler";
import { EquationCommandSet } from "./command_set";

export { Equation, EquationHandler };
export function EquationBlock(): BlockComponent<Equation> {
  return {
    name: "equation",
    blockType: Equation,
    handlers: {
      blocks: { equation: new EquationHandler() },
    },
    serializer: new EquationSerializer(),
    commandSet: new EquationCommandSet(),
  };
}
