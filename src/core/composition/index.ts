import { HandlerEntry } from "@/system/page";
import { CompositionHandler } from "./composition";

export * from "./composition";

// export const CompositionHandlerEntry :HandlerEntry = {
//     'startHandler':new Composi
// }

export function CompositionHandlerEntry(): HandlerEntry {
  return {
    startHandler: new CompositionHandler(),
  };
}
