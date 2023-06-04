import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { List, ABCList, ListData, ListSerializer } from "./block";
import { ListHandler } from "./handler";

export { List, ListHandler, ABCList };
export type { ListData as ListInit };

export function ListBlock(): BlockComponent {
  return {
    name: "list",
    blockType: List,
    handlers: {
      blocks: { list: new ListHandler() },
    },
    serializer: new ListSerializer(),
  };
}
