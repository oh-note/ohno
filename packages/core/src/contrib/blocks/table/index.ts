import { BlockComponent, HandlerEntry } from "@ohno-editor/core/system/page";
import { Table } from "./block";
import { TableHandler } from "./handler";

export { TableChange } from "./command";
export { Table, TableHandler };

export function TableBlock(): BlockComponent {
  return {
    name: "table",
    blockType: Table,
    handlers: {
      blocks: { table: new TableHandler() },
    },
  };
}
