import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { List, ABCList } from "./block";
import { ListHandler } from "./handler";

export { List, ListHandler, ABCList };

export function ListBlock(): BlockComponent {
  return {
    name: "list",
    blockType: List,
    handlers: {
      blocks: { list: new ListHandler() },
    },
  };
}
