// 实现 block 的基本接口和默认行为
import { Page } from "../types";
import { outerHTML } from "@ohno-editor/core/helper/element";
import { Block, BlockData } from "./imp";

export interface BlockSerializer<T extends Block> {
  setPage(page: Page): void;
  toMarkdown(block: T): string;
  toHTML(block: T): string;
  toJson(block: T): BlockSerializedData<T["meta"]>;
  serialize(block: T, type: "markdown"): string;
  serialize(block: T, type: "html"): string;
  serialize(block: T, type: "json"): BlockSerializedData<T["meta"]>;
  serializePart(block: T, clipedRange: Range, type: "markdown"): string;
  serializePart(block: T, clipedRange: Range, type: "html"): string;
  serializePart(
    block: T,
    clipedRange: Range,
    type: "json"
  ): BlockSerializedData<T["meta"]>;

  deserialize(data: BlockSerializedData<T["meta"]>): T;
}

export type BlockSerializedData<T extends BlockData = BlockData> = {
  type: string;
  data: T;
  dataset?: { [key: string]: any; order?: never; type?: never };
};

export type InRangeEditable = {
  start?: Node[];
  startEditable: HTMLElement;
  full?: HTMLElement[];
  end?: Node[];
  endEditable: HTMLElement;
};

export abstract class BaseBlockSerializer<T extends Block>
  implements BlockSerializer<T>
{
  page!: Page;
  setPage(page: Page) {
    this.page = page;
  }

  abstract toMarkdown(block: T): string;
  abstract toJson(block: T): BlockSerializedData<T["meta"]>;

  partToMarkdown(block: T, range: Range): string {
    return this.toMarkdown(block);
  }
  partToJson(block: T, range: Range): BlockSerializedData<T["meta"]> {
    return this.toJson(block);
  }

  rangedEditable(block: T, range: Range): InRangeEditable {
    if (block.selection.isNodeInRange(block.root, range)) {
      return {
        full: block.getEditables(),
        startEditable: block.getFirstEditable(),
        endEditable: block.getLastEditable(),
      };
    }

    let startEditable = block.findEditable(range.startContainer);
    let endEditable = block.findEditable(range.endContainer);
    const startFull = startEditable === null;
    const endFull = endEditable === null;
    if (!startEditable) {
      startEditable = block.getFirstEditable();
    }
    if (!endEditable) {
      endEditable = block.getLastEditable();
    }
    const res: InRangeEditable = { startEditable, endEditable };
    let cur = startEditable;
    const full = [];

    if (startEditable === endEditable) {
      if (startFull && endFull) {
        full.push(startEditable);
      } else if (startFull && !endFull) {
        const clipedRange = block.selection.clipRange(startEditable, range)!;
        res.end = Array.from(clipedRange.cloneContents().childNodes);
      } else {
        // !startFull && endFull
        // !startFull && !endFull
        const clipedRange = block.selection.clipRange(startEditable, range)!;
        res.start = Array.from(clipedRange.cloneContents().childNodes);
      }
    } else {
      if (startFull) {
        full.push(startEditable);
      } else {
        const clipedRange = block.selection.clipRange(startEditable, range)!;
        res.start = Array.from(clipedRange.cloneContents().childNodes);
      }
      while (cur && cur !== endEditable) {
        cur = block.getNextEditable(cur)!;
        if (cur && cur !== endEditable) {
          full.push(cur);
        }
      }
      if (endFull) {
        full.push(endEditable);
      } else {
        const clipedRange = block.selection.clipRange(endEditable, range)!;
        res.end = Array.from(clipedRange.cloneContents().childNodes);
      }
    }
    if (full.length > 0) {
      res.full = full;
    }
    return res;
  }

  toHTML(block: T): string {
    return outerHTML(block.root);
  }

  outerHTML(...node: Node[]): string {
    return outerHTML(...node);
  }

  public get serializeInline() {
    return this.page.inlineSerializerV2.serialize.bind(
      this.page.inlineSerializerV2
    );
  }

  serialize(block: T, type: "markdown"): string;
  serialize(block: T, type: "html"): string;
  serialize(block: T, type: "json"): BlockSerializedData<T["meta"]>;
  serialize(block: T, type: "markdown" | "html" | "json"): any {
    if (type === "markdown") {
      return this.toMarkdown(block);
    } else if (type === "html") {
      return this.toHTML(block);
    } else if (type === "json") {
      return this.toJson(block);
    }
    throw new Error("not implemented");
  }

  serializePart(block: T, range: Range, type: "markdown"): string;
  serializePart(block: T, range: Range, type: "html"): string;
  serializePart(
    block: T,
    range: Range,
    type: "json"
  ): BlockSerializedData<T["meta"]>;

  serializePart(
    block: T,
    range: Range,
    type: "markdown" | "html" | "json"
  ): any {
    if (type === "markdown") {
      return this.partToMarkdown(block, range);
    } else if (type === "html") {
      return this.outerHTML(...Array.from(range.cloneContents().childNodes));
    } else if (type === "json") {
      return this.partToJson(block, range);
    }
    throw new Error("not implemented");
  }

  abstract deserialize(data: BlockSerializedData<T["meta"]>): T;
}
