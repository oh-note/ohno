import { HandlerEntry } from "@ohno-editor/core/system/page";
import { BlockModeHandler } from "./handler";

export function BlockModeHandlerEntry(): HandlerEntry {
  return {
    plugins: new BlockModeHandler(),
  };
}
