import { HandlerEntry } from "@ohno-editor/core/system/page";
import { DefaultBlockHandler } from "./block";

export * from "./block";
export * from "./beforeInput";
export * from "./arrowDown";
export * from "./paste";

export function DefaultBlockHandlerEntry(): HandlerEntry {
  return {
    global: new DefaultBlockHandler(),
  };
}
