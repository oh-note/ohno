import { HTMLElementTagName } from "@helper/document";
import { createElement } from "@helper/document";
import { ValidNode, getTagName, outerHTML } from "@helper/element";
import { parentElementWithTag, validChildNodes } from "@helper/element";
import { addMarkdownHint } from "@helper/markdown";
import {
  FULL_BLOCK as FULL_SELECTED,
  Offset,
  elementOffset,
  offsetToRange,
  setOffset,
} from "@system/position";
import { AnyBlock } from "@system/block";
import { Command } from "@system/history";
import { Page } from "@system/page";
import {
  getValidAdjacent,
  nodesOfRange,
  normalizeRange,
  setRange,
} from "@system/range";

export interface IBlockRemovePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  label: HTMLLabelElement;
  // remove?: boolean;
  undo_hint?: {
    label: HTMLLabelElement;
    offset: Offset;
  };
  intime?: {
    range: Range;
  };
}

export class IBlockRemove extends Command<IBlockRemovePayload> {
  execute(): void {
    const { page, block, label } = this.payload;
    const container = block.currentContainer();
    const offset = elementOffset(container, label);
    this.payload.undo_hint = {
      label: label.cloneNode(true) as HTMLLabelElement,
      offset: offset,
    };

    label.remove();
    setOffset(container, { ...offset, end: undefined });
  }
  undo(): void {
    const { block, offset } = this.payload;
    const { label, offset: beforeOffset } = this.payload.undo_hint!;
    const range = offsetToRange(block.getContainer(offset.index), {
      start: beforeOffset.start,
    });
    range?.insertNode(label);
    block.setOffset(offset);
  }
}
