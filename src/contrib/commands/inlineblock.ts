import {
  Offset,
  elementOffset,
  offsetToRange,
  setOffset,
} from "@/system/position";
import { AnyBlock } from "@/system/block";
import { Command, CommandBuffer, CommandCallback } from "@/system/history";
import { Page } from "@/system/page";
import { createRange, setRange } from "@/system/range";

export interface IBlockRemovePayload {
  page: Page;
  block: AnyBlock;
  label: HTMLLabelElement;
  intime?: {
    range: Range;
  };
}

export interface IBlockReplacePayload {
  page: Page;
  block: AnyBlock;
  old: HTMLElement;
  label: HTMLElement;
}

// export class IBlockSubmit extends Com

// 已经更改完了的 label 和 old
export class IBlockSubmit extends Command<IBlockReplacePayload> {
  declare buffer: {
    current: HTMLElement;
    label: HTMLElement;
    old: HTMLElement;
    offset: Offset;
  };

  onExecuteFn?: CommandCallback<IBlockReplacePayload> = ({ page }) => {
    const label = this.buffer.current;
    page.activateInline(label);
    setRange(createRange(label, 0));
  };
  onUndoFn: CommandCallback<IBlockReplacePayload> = ({ page }) => {
    const label = this.buffer.current;
    page.activateInline(label);
    setRange(createRange(label, 0));
  };

  execute(): void {
    const { block, label, old } = this.payload;
    // clone 是为了防止删除时 current（在 document 上的 element）消失
    if (this.buffer.offset) {
      const { offset, label } = this.buffer!;
      const range = offsetToRange(block.root, {
        start: offset.start,
        end: offset.start + 2,
      })!;
      range.deleteContents();
      range.insertNode(label);
      this.buffer = {
        ...this.buffer,
        current: label,
        label: label.cloneNode(true) as HTMLElement,
      };
    } else {
      const offset = elementOffset(block.root, label);
      this.buffer = {
        ...this.buffer,
        current: label,
        label: label.cloneNode(true) as HTMLLabelElement,
        old: old.cloneNode(true) as HTMLLabelElement,
        offset: offset,
      };
    }
  }

  undo(): void {
    const { block } = this.payload;
    const { old, offset } = this.buffer!;
    const range = offsetToRange(block.root, {
      start: offset.start,
      end: offset.start + 2,
    })!;
    range.deleteContents();
    range.insertNode(old);
    this.buffer.current = old;
    this.buffer.old = old.cloneNode(true) as HTMLElement;
  }
}

export class IBlockRemove extends Command<IBlockRemovePayload> {
  declare buffer: {
    current: HTMLElement;
    label: HTMLLabelElement;
    offset: Offset;
  };

  onExecuteFn?: CommandCallback<IBlockRemovePayload> = ({ block }) => {
    block.setOffset({ ...this.buffer.offset, end: undefined });
  };

  onUndoFn?: CommandCallback<IBlockRemovePayload> = ({ page, block }) => {
    const label = this.buffer.current;
    page.activateInline(label);
    block.setRange(createRange(label, 0));
  };

  execute(): void {
    const { block, label } = this.payload;
    const { offset } = this.buffer;
    if (offset) {
      const range = offsetToRange(block.root, offset)!;
      range.deleteContents();
    } else {
      const offset = elementOffset(block.root, label);
      this.buffer = {
        current: label,
        label: label.cloneNode(true) as HTMLLabelElement,
        offset: offset,
      };
      label.remove();
    }
  }
  undo(): void {
    const { block } = this.payload;
    const { label, offset } = this.buffer!;
    const range = offsetToRange(block.root, {
      start: offset.start,
    })!;
    range.insertNode(label);
    this.buffer.current = label;
    this.buffer.label = label.cloneNode(true) as HTMLLabelElement;
  }
}
