import { HandlerEntry } from "@ohno-editor/core/system/page";
import { DefaultBlockHandler } from "./handler";
import { SHORCUTS } from "./consts";

export * from "./handler";
export * from "./functions/beforeInput";
export * from "./functions/arrowDown";
export * from "./functions/paste";

export function DefaultBlockHandlerEntry(): HandlerEntry {
  return {
    global: new DefaultBlockHandler(),
    onPageCreated: (page) => {
      SHORCUTS.forEach(([entry, st]) => {
        page.shortcut.registKey(entry, st);
      });
    },
  };
}
