import { BlockEntry, HandlerEntry } from "@/system/page";
import { ListHandler } from "./handler";
import { List } from "./block";

export * from "./handler";
export * from "./block";

export const ListHandlers: HandlerEntry = {
  blockHandler: new ListHandler(),
};

export const ListBlockEntry: BlockEntry = {
  name: "list",
  blockType: List,
  handler: new ListHandler(),
};
