import { HandlerEntry } from "@ohno-editor/core/system/page";
import { CompositionHandler } from "./composition";

export * from "./composition";

export function CompositionHandlerEntry(): HandlerEntry {
  return {
    beforeBlock: new CompositionHandler(),
  };
}
