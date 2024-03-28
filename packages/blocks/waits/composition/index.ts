import { HandlerEntry } from "../../system/types";
import { CompositionHandler } from "./composition";

export * from "./composition";

export function CompositionHandlerEntry(): HandlerEntry {
  return {
    global: new CompositionHandler(),
  };
}
