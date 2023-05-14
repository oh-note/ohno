import { HandlerEntry } from "@ohno-editor/core/system/page";
import { MultiBlockHandler } from "./multiblock";

export function MultiBlockHandlerEntry(): HandlerEntry {
  return {
    multiblock: new MultiBlockHandler(),
  };
}
