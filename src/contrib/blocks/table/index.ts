import { BlockComponent, HandlerEntry } from "@/system/page";
import { Table } from "./block";
import { TableHandler } from "./handler";

export * from "./handler";
export * from "./block";

export function TableBlock(): BlockComponent {
  return {
    blockType: Table,
    handlers: {
      blocks: { table: new TableHandler() },
    },
  };
}
