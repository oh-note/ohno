// TODO 把 index 添加好，所有 Handler 都应该通过 Function 获取，为后续的配置项提供可能。
import { HandlerEntry } from "@/system/page";
import { InlineActivateHandler } from "./inlineActivate";

export function InlineHandlerEntry(): HandlerEntry {
  return {
    // global: new InlineActivateHandler(),
  };
}
