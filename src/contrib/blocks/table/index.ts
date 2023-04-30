import { BlockEntry, HandlerEntry } from "@/system/page";
import { TableHandler } from "./handler";
import { Table } from "./block";

export * from "./handler";
export * from "./block";

export const TableHandlers: HandlerEntry = {
  blockHandler: new TableHandler(),
};

export const TableBlockEntry: BlockEntry = {
  name: "table",
  blockType: Table,
  handler: new TableHandler(),
};
