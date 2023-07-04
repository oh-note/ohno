import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import TableSerializer, { Table } from "./block";
import { TableHandler } from "./handler";
import { SHORCUTS } from "./consts";

export { TableChange } from "./command";
export { Table, TableHandler };

export function TableBlock(): BlockComponent {
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
  };
}
