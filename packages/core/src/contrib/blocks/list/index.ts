import {
  BlockComponent,
  HandlerEntry,
  Page,
} from "@ohno-editor/core/system/page";
import { List, ABCList, ListData, ListSerializer } from "./block";
import { ListHandler } from "./handler";
import { setupPasteAll, setupSlashMenu } from "./setup";

export { List, ListHandler, ABCList };
export type { ListData as ListInit };

export function ListBlock(): BlockComponent {
  return {
    name: "list",
    blockType: List,
    handlers: {
      blocks: { list: new ListHandler() },
    },
    onPageCreated: (page) => {
      setupSlashMenu(page);
      setupPasteAll(page);
    },
    serializer: new ListSerializer(),
  };
}
