import { Offset, offsetToRange } from "../../system/position";
import { AnyBlock, Block } from "../../system/block";
import { Command } from "../../system/history";
import { Page } from "../../system/page";
import { setRange } from "../../system/range";

export interface TextEditPayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  value: string;
  intime?: {
    range: Range;
  };
}

export class InsertText extends Command<TextEditPayload> {
  execute(): void {
    let range: Range;
    if (this.payload.intime) {
      range = this.payload.intime.range;
      this.payload.intime = undefined;
    } else {
      const block = this.payload.block;
      const offset = this.payload.offset;
      range = offsetToRange(block.getContainer(offset.index!), offset)!;
    }
    const node = document.createTextNode(this.payload.value);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    setRange(range);
  }
  undo(): void {
    const block = this.payload.block;
    const offset = Object.assign({}, this.payload.offset);
    offset.end = offset.start + this.payload.value.length;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    range.deleteContents();
    setRange(range);
  }

  public get label(): string {
    return `insert ${this.payload.value}`;
  }

  tryMerge(command: InsertText): boolean {
    if (!(command instanceof InsertText)) {
      return false;
    }
    if (command.payload.value.indexOf(" ") >= 0) {
      return false;
    }
    if (
      command.payload.block.equals(this.payload.block) &&
      this.payload.offset.start + this.payload.value.length ===
        command.payload.offset.start
    ) {
      this.payload.value += command.payload.value;
      return true;
    }
    return false;
  }
}

export class DeleteTextBackward extends Command<TextEditPayload> {
  execute(): void {
    // TODO apply intime
    const block = this.payload.block;
    const offset = Object.assign({}, this.payload.offset);
    offset.end = offset.start + this.payload.value.length;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    range.deleteContents();
    setRange(range);
  }
  undo(): void {
    let range: Range;
    const block = this.payload.block;
    const offset = this.payload.offset;
    range = offsetToRange(block.getContainer(offset.index!), offset)!;
    const node = document.createTextNode(this.payload.value);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    setRange(range);
  }
  public get label(): string {
    return `delete ${this.payload.value}`;
  }

  tryMerge(command: DeleteTextBackward): boolean {
    if (!(command instanceof DeleteTextBackward)) {
      return false;
    }
    if (command.payload.value.indexOf(" ") >= 0) {
      return false;
    }
    // 更早的左删除命令在的 offset 在右侧
    if (
      command.payload.block.equals(this.payload.block) &&
      command.payload.offset.start + command.payload.value.length ===
        this.payload.offset.start
    ) {
      this.payload.offset = command.payload.offset;
      this.payload.value = command.payload.value + this.payload.value;
      return true;
    }
    return false;
  }
}

export class DeleteTextForward extends Command<TextEditPayload> {
  execute(): void {
    // TODO apply intime
    const block = this.payload.block;
    const offset = this.payload.offset;
    offset.end = offset.start + this.payload.value.length;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    range.deleteContents();
    setRange(range);
  }
  undo(): void {
    let range: Range;
    const block = this.payload.block;
    const offset = this.payload.offset;
    range = offsetToRange(block.getContainer(offset.index!), offset)!;
    const node = document.createTextNode(this.payload.value);
    range.insertNode(node);
    range.setStartBefore(node);
    range.setEndBefore(node);
    setRange(range);
  }
  public get label(): string {
    return `delete ${this.payload.value}`;
  }

  tryMerge(command: DeleteTextForward): boolean {
    if (!(command instanceof DeleteTextForward)) {
      return false;
    }
    if (command.payload.value.indexOf(" ") >= 0) {
      return false;
    }
    // 更早的右删除命令在的 offset 在左侧
    if (
      command.payload.block.equals(this.payload.block) &&
      command.payload.offset.start === this.payload.offset.start
    ) {
      // this.payload.offset.end = command.payload.offset.end;
      this.payload.value += command.payload.value;
      return true;
    }
    return false;
  }
}
