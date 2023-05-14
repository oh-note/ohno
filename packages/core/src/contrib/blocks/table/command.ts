import { AnyBlock } from "@ohno-editor/core/system/block";
import { Command } from "@ohno-editor/core/system/history";
import { Page } from "@ohno-editor/core/system/page";
import { Table } from "./block";

export interface TableChangePayload {
  page: Page;
  block: Table;
  index: number;
  axis: "row" | "column";
}

export class TableChange extends Command<TableChangePayload> {
  execute(): void {
    const { block, index, axis } = this.payload;
    if (axis === "row") {
      block.addRow(index);
    } else {
      block.addColumn(index);
    }
  }
  undo(): void {
    const { block, index, axis } = this.payload;
    if (axis === "row") {
      block.removeRow(index);
    } else {
      block.removeColummn(index);
    }
  }
}
