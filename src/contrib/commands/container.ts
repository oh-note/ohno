import {
  FIRST_POSITION,
  Offset,
  elementOffset,
  getTokenSize,
  offsetToRange,
} from "@system/position";
import { AnyBlock } from "@system/block";
import { Command, Payload } from "@system/history";
import { Page } from "@system/page";
import { nodesOfRange, setRange } from "@system/range";
import { addMarkdownHint } from "@helper/markdown";
import { ValidNode, calcDepths } from "@helper/element";
import {
  createElement,
  createFlagNode,
  createTextNode,
  innerHTMLToNodeList,
} from "@helper/document";

export interface ContainerInsertPayload {
  page: Page;
  block: AnyBlock;
  index: number;
  newContainer: HTMLElement[];
  where: "above" | "below";
  beforeOffset?: Offset;
  afterOffset?: Offset;
  undo_hint?: {
    newIndex: number[];
  };
}

export interface ContainerRemovePayload extends Payload {
  page: Page;
  block: AnyBlock;
  beforeOffset?: Offset;
  index: number[];
  undo_hint?: {
    deletedContainer: HTMLElement[];
  };
}

export function makeNode({
  textContent,
  innerHTML,
}: {
  textContent?: string;
  innerHTML?: string;
}): ValidNode[] {
  if (textContent !== undefined && innerHTML !== undefined) {
    throw new Error("textContent and innerHTML can only have one");
  }
  if (innerHTML !== undefined) {
    return innerHTMLToNodeList(innerHTML) as ValidNode[];
  }
  return [createTextNode(textContent)];
}

export class ContainerInsert extends Command<ContainerInsertPayload> {
  execute(): void {
    const { block, index, where, newContainer } = this.payload;
    if (!this.payload.beforeOffset) {
      this.payload.beforeOffset = block.getOffset();
    }
    const cur = block.getContainer(index);
    const flag = createFlagNode();
    if (where === "above") {
      cur.insertAdjacentElement("beforebegin", flag);
    } else {
      cur.insertAdjacentElement("afterend", flag);
    }
    flag.replaceWith(...newContainer);
    const newIndex = newContainer.map((item) => {
      return block.getIndexOfContainer(item);
    });
    // const newIndex = block.getIndexOfContainer(newContainer);
    if (!this.payload.afterOffset) {
      this.payload.afterOffset = { ...FIRST_POSITION, index: newIndex[0] };
    }
    this.payload.undo_hint = {
      newIndex: newIndex,
    };
    block.setOffset(this.payload.afterOffset);
  }
  undo(): void {
    const { block, beforeOffset } = this.payload;
    const newIndex = this.payload.undo_hint!.newIndex;
    newIndex
      .slice()
      .reverse()
      .forEach((item) => {
        const newContainer = block.getContainer(item);
        newContainer.remove();
      });
    block.setOffset(beforeOffset!);
  }

  public get label(): string {
    return `insert container`;
  }

  tryMerge(command: ContainerInsert): boolean {
    return false;
  }
}

export class ContainerRemove extends Command<ContainerRemovePayload> {
  execute(): void {
    let { block, index } = this.payload;
    this.payload.index = index.slice().sort().reverse();
    if (!this.payload.beforeOffset) {
      this.payload.beforeOffset = block.getOffset();
    }
    this.payload.undo_hint = {
      deletedContainer: this.payload.index
        .map((item) => {
          const container = block.getContainer(item);
          container.remove();
          return container.cloneNode(true) as HTMLElement;
        })
        .reverse(),
    };
  }
  undo(): void {
    const { undo_hint, block, index, beforeOffset } = this.payload;
    // 删掉原来的 common 部分

    index
      .slice()
      .reverse()
      .forEach((item, ind) => {
        console.log("undo remove container", [item, ind]);
        const container = undo_hint!.deletedContainer[ind];
        let cur;
        if ((cur = block.getContainer(item))) {
          cur.insertAdjacentElement("beforebegin", container);
        } else {
          block.el.appendChild(container);
        }
      });
  }
}
