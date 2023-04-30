import { PluginEntry } from "@/system/page";
import { InlineMathHandler } from "./handler";
import { InlineMath, Option } from "./instance";

export default function (): PluginEntry {
  const instance = new InlineMath();

  return {
    name: "math",
    instance: instance,
    handler: new InlineMathHandler({ instance }),
  };
}
