import { BlockComponent } from "../../../system/types";
import TableSerializer, { Table } from "./block";
import { TableHandler } from "./handler";
import { SHORCUTS } from "./consts";
import { TableCommandSet } from "./command_set";

export { TableChange } from "./command";
export { Table, TableHandler };

export function TableBlock(): BlockComponent<Table> {
  return {
    name: "table",
    blockType: Table,
    handlers: {
      blocks: { table: new TableHandler() },
    },
    onPageCreated: (page) => {
      SHORCUTS.forEach(([entry, st]) => {
        page.shortcut.registKey(entry, st);
      });
    },
    serializer: new TableSerializer(),
    commandSet: new TableCommandSet(),
  };
}
