import { Offset } from "../../helper/position";
import { AnyBlock, Block } from "../../system/block";
import { Command } from "../../system/history";
import { Page } from "../../system/page";

export interface BlockPayload {
  page: Page;
  block: AnyBlock;
  type: string; // block type name
  init?: any;
  // set in execute() and used in undo()
  order?: string;
  position?: Offset; // old position
}

export interface BlockCreatePayload extends BlockPayload {}

export class BlockCreate extends Command<BlockCreatePayload> {
  execute(): void {
    const { page } = this.payload;
    // 暂存光标
    // const newBlock = page.appendBlock(...);
    // 设置新光标
  }
  undo(): void {
    const { page, order } = this.payload;
    if (!order) {
      throw new Error("Sanity check failed");
    }
    page.removeBlock(order);
    // 恢复光标
  }
  tryMerge(command: Command<any>): boolean {
    return false;
  }
}
