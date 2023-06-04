import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { OrderedList, OrderedListSerializer } from "./block";
import { OrderedListHandler } from "./handler";

export { OrderedList, OrderedListHandler };

export function OrderedListBlock(): BlockComponent {
  return {
    name: "ordered_list",
    blockType: OrderedList,
    handlers: {
      blocks: { ordered_list: new OrderedListHandler() },
    },
    serializer: new OrderedListSerializer(),
  };
}
