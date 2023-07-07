import { HandlerEntry } from "@ohno-editor/core/system/types";
import { MultiBlockHandler } from "./handler";

export function MultiBlockHandlerEntry(): HandlerEntry {
  return {
    multiblock: new MultiBlockHandler(),
  };
}
