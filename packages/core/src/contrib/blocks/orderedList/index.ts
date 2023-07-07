import { BlockComponent } from "@ohno-editor/core/system/types";
import { OrderedList, OrderedListSerializer } from "./block";
import { OrderedListHandler } from "./handler";
import { ABCListCommandSet } from "../list/command_set";

export { OrderedList, OrderedListHandler };

export function OrderedListBlock(): BlockComponent<OrderedList> {
  return {
    name: "ordered_list",
    blockType: OrderedList,
    handlers: {
      blocks: { ordered_list: new OrderedListHandler() },
    },
    serializer: new OrderedListSerializer(),
    commandSet: new ABCListCommandSet(),
  };
}
