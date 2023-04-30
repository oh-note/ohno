import { BlockEntry, HandlerEntry } from "@/system/page";
import { OrderedListHandler } from "./handler";
import { OrderedList } from "./block";

export * from "./handler";
export * from "./block";

export const OrderedListHandlers: HandlerEntry = {
  blockHandler: new OrderedListHandler(),
};

export const OrderedListBlockEntry: BlockEntry = {
  name: "ordered_list",
  blockType: OrderedList,
  handler: new OrderedListHandler(),
};
