import { HandlerEntry } from "@/system/page";
import { MultiBlockHandler } from "./multiblock";

export function MultiBlockHandlerEntry(): HandlerEntry {
  return {
    multiblock: new MultiBlockHandler(),
  };
}
