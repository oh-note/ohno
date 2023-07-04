import { removeActivate, removeHover } from "@ohno-editor/core/helper";
import { CommandCallback } from "../command";
import {
  getValidAdjacent,
  intervalOfElement,
  intervalToRange,
} from "../selection";
import { AnyBlock, Interval, Page, Command } from "../types";
import { InlineSupport } from "./plugin";

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
    offset: Interval;
  };

  onExecuteFn?: CommandCallback<IBlockReplacePayload> = ({ page }) => {
    const label = this.buffer.current;
    const plugin = page.getPlugin<InlineSupport>("inlinesupport");
    const manager = plugin.getInlineManager(label);
    this.payload.page.setLocation(getValidAdjacent(label, "afterend"));
    plugin.setHoveredInline("cursor");
    plugin.setHoveredInline("mouse");
    plugin.setActiveInline();
    removeHover(label);
    removeActivate(label);
  };

  onUndoFn: CommandCallback<IBlockReplacePayload> = ({ page }) => {
    const label = this.buffer.current;
    const plugin = page.getPlugin<InlineSupport>("inlinesupport");
    const manager = plugin.getInlineManager(label);
    this.payload.page.setLocation(getValidAdjacent(label, "afterend"));
    plugin.setHoveredInline("cursor");
    plugin.setHoveredInline("mouse");
    plugin.setActiveInline();
    removeHover(label);
    removeActivate(label);
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
      const offset = intervalOfElement(block.root, label);
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
