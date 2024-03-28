import { BlockComponent } from "../../../system/types";
import { List, ABCList, ListData, ListSerializer } from "./block";
import { ListHandler } from "./handler";
import { setupPasteAll, setupSlashMenu } from "./setup";
import { ABCListCommandSet } from "./command_set";

export { List, ListHandler, ABCList };
export type { ListData as ListInit };

export function ListBlock(): BlockComponent<List> {
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
    commandSet: new ABCListCommandSet(),
  };
}
