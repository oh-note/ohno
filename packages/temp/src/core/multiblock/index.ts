import { HandlerEntry } from "@ohno/core/system/types";
import { MultiBlockHandler } from "./handler";

export function MultiBlockHandlerEntry(): HandlerEntry {
  return {
    multiblock: new MultiBlockHandler(),
  };
}
