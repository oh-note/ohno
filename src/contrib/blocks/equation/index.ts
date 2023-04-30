import { BlockEntry, HandlerEntry } from "@/system/page";
import { EquationHandler } from "./handler";
import { Equation } from "./block";

export * from "./handler";
export * from "./block";

export const EquationHandlers: HandlerEntry = {
  blockHandler: new EquationHandler(),
};

export const EquationBlockEntry: BlockEntry = {
  name: "equation",
  blockType: Equation,
  handler: new EquationHandler(),
};
