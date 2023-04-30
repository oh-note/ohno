import { PluginEntry } from "@/system/page";
import { DropdownHandler } from "./handler";
import { Dropdown, Option } from "./instance";

export default function (options: Option[] = []): PluginEntry {
  const dropdown = new Dropdown();
  options.forEach((item) => {
    dropdown.add(item);
  });

  return {
    name: "dropdown",
    instance: dropdown,
    handler: new DropdownHandler({ dropdown }),
  };
}
