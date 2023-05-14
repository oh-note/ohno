import {
  Offset,
  elementOffset,
  intervalToRange,
  setOffset,
} from "@ohno-editor/core/system/position";
import { AnyBlock } from "@ohno-editor/core/system/block";
import {
  Command,
  CommandBuffer,
  CommandCallback,
} from "@ohno-editor/core/system/history";
import { Page } from "@ohno-editor/core/system/page";
import { createRange, setRange } from "@ohno-editor/core/system/range";

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
  old: HTMLLabelElement;
  label: HTMLLabelElement;
}

// export class IBlockSubmit extends Com

// 已经更改完了的 label 和 old
export class InlineSubmit extends Command<IBlockReplacePayload> {
  declare buffer: {
    current: HTMLLabelElement;
    label: HTMLLabelElement;
    old: HTMLLabelElement;
    offset: Offset;
  };

  onExecuteFn?: CommandCallback<IBlockReplacePayload> = ({ page }) => {
    const label = this.buffer.current;
    page.setActiveInline(label);
    setRange(createRange(label, 0));
  };
  onUndoFn: CommandCallback<IBlockReplacePayload> = ({ page }) => {
    const label = this.buffer.current;
    page.setActiveInline(label);
    setRange(createRange(label, 0));
  };

  execute(): void {
    const { block, label, old } = this.payload;
    // clone 是为了防止删除时 current（在 document 上的 element）消失
    if (this.buffer.offset) {
      const { offset, label } = this.buffer!;
      const range = intervalToRange(block.root, {
        start: offset.start,
        end: offset.start + 2,
      })!;
      range.deleteContents();
      range.insertNode(label);
      this.buffer = {
        ...this.buffer,
        current: label,
        label: label.cloneNode(true) as HTMLLabelElement,
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
    const range = intervalToRange(block.root, {
      start: offset.start,
      end: offset.start + 2,
    })!;
    range.deleteContents();
    range.insertNode(old);
    this.buffer.current = old;
    this.buffer.old = old.cloneNode(true) as HTMLLabelElement;
  }
}

export class IBlockRemove extends Command<IBlockRemovePayload> {
  declare buffer: {
    current: HTMLLabelElement;
    label: HTMLLabelElement;
    start: number;
  };

  // onExecuteFn?: CommandCallback<IBlockRemovePayload> = ({ block }) => {
  //   block.setOffset({ ...this.buffer.offset, end: undefined });
  // };

  // onUndoFn?: CommandCallback<IBlockRemovePayload> = ({ page, block }) => {
  //   const label = this.buffer.current;
  //   page.activateInline(label);
  //   block.setRange(createRange(label, 0));
  // };

  execute(): void {
    const { block, label } = this.payload;
    const { start } = this.buffer;

    if (start) {
      const label = block.getGlobalLocation(start + 1)![0] as HTMLLabelElement;
      label.remove();
    } else {
      const bias = block.getGlobalBias([label, 0]) - 1;
      // const offset = elementOffset(block.root, label);
      this.buffer = {
        current: label,
        label: label.cloneNode(true) as HTMLLabelElement,
        start: bias,
      };
      label.remove();
    }
  }
  undo(): void {
    const { block } = this.payload;
    const { label, start } = this.buffer!;
    const startLoc = block.getGlobalLocation(start)!;
    const range = createRange(...startLoc);
    range.insertNode(label);
    this.buffer.current = label;
    this.buffer.label = label.cloneNode(true) as HTMLLabelElement;
  }
}
