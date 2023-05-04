import { BlockComponent, HandlerEntry } from "@/system/page";
import { OrderedList } from "./block";
import { OrderedListHandler } from "./handler";

export * from "./handler";
export * from "./block";

export function OrderedListBlock(): BlockComponent {
  return {
    blockType: OrderedList,
    handlers: {
      blocks: { ordered_list: new OrderedListHandler() },
    },
  };
}
