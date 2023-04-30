import { PluginEntry } from "@/system/page";
import { HighlightHandler } from "./handler";
import { InlineMath, Option } from "./instance";

export default function (): PluginEntry {
  const instance = new InlineMath();

  return {
    name: "highlight",
    instance: instance,
    handler: new HighlightHandler({ instance }),
  };
}
