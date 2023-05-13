import { HandlerEntry } from "@/system/page";
import { DefaultBlockHandler } from "./block";

export function DefaultBlockHandlerEntry(): HandlerEntry {
  return {
    global: new DefaultBlockHandler(),
  };
}
