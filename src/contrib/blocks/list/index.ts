import { BlockComponent, HandlerEntry } from "@/system/page";
import { List } from "./block";
import { ListHandler } from "./handler";

export * from "./handler";
export * from "./block";

export function ListBlock(): BlockComponent {
  return {
    blockType: List,
    handlers: {
      blocks: { list: new ListHandler() },
    },
  };
}
