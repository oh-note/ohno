import { HandlerEntry } from "../../system/types";
import { DefaultBlockHandler } from "./handler";
import { SHORCUTS } from "./consts";

export * from "./handler";
export * from "./functional/beforeInput";
export * from "./functional/arrowDown";
export * from "./functional/paste";

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
