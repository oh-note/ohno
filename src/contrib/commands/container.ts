import {
  FIRST_POSITION,
  Offset,
  elementOffset,
  getTokenSize,
  intervalToRange,
} from "@/system/position";
import { AnyBlock } from "@/system/block";
import { Command, CommandBuffer, Payload } from "@/system/history";
import { Page } from "@/system/page";
import { nodesOfRange, setRange } from "@/system/range";
import { addMarkdownHint } from "@/helper/markdown";
import { ValidNode, calcDepths } from "@/helper/element";
import {
  createElement,
  createFlagNode,
  createTextNode,
  innerHTMLToNodeList,
} from "@/helper/document";

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
  // beforeOffset?: Offset;

  indexs: number[];
  // undo_hint?: {
  //   deletedContainer: HTMLElement[];
  // };
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
  declare buffer: {
    newIndex: number[];
  };
  execute(): void {
    const { block, index, where, newContainer } = this.payload;
    // if (!this.payload.beforeOffset) {
    //   this.payload.beforeOffset = block.getOffset();
    // }
    const cur = block.getEditable(index);
    const flag = createFlagNode();

    if (where === "above") {
      cur.insertAdjacentElement("beforebegin", flag);
    } else {
      cur.insertAdjacentElement("afterend", flag);
    }
    flag.replaceWith(...newContainer);
    const newIndex = newContainer.map((item) => {
      return block.getEditableIndex(item);
    });
    this.buffer = {
      newIndex,
    };
    // const newIndex = block.getIndexOfContainer(newContainer);
    // if (!this.payload.afterOffset) {
    //   this.payload.afterOffset = { ...FIRST_POSITION, index: newIndex[0] };
    // }
    // this.payload.undo_hint = {
    //   newIndex: newIndex,
    // };
    // block.setOffset(this.payload.afterOffset);
  }
  undo(): void {
    const { block } = this.payload;
    const newIndex = this.buffer.newIndex;
    newIndex
      .slice()
      .reverse()
      .forEach((item) => {
        const newContainer = block.getEditable(item)!;
        newContainer.remove();
      });
    // block.setOffset(beforeOffset!);
  }

  public get label(): string {
    return `insert container`;
  }

  tryMerge(command: ContainerInsert): boolean {
    return false;
  }
}

export class ContainerRemove extends Command<ContainerRemovePayload> {
  declare buffer: {
    deletedContainer: HTMLElement[];
  };
  execute(): void {
    let { block, indexs: index } = this.payload;
    // 逆序删除，顺序添加
    const deletedContainer = index
      .slice()
      .sort()
      .reverse()
      .map((item) => {
        const container = block.getEditable(item)!;
        container.remove();
        return container.cloneNode(true) as HTMLElement;
      })
      .reverse();
    this.buffer = {
      deletedContainer,
    };
  }
  undo(): void {
    const { block, indexs: index } = this.payload;
    // 顺序添加
    index.forEach((item, ind) => {
      const container = this.buffer.deletedContainer[ind];
      let cur;
      if ((cur = block.getEditable(item)!)) {
        cur.insertAdjacentElement("beforebegin", container);
      } else {
        block.root.appendChild(container);
      }
    });
  }
}
export interface SetAttributePayload {
  block: AnyBlock;
  index: number;
  name: string;
  value: string;
  // type: "int" | "string" | "boolean";
}

export interface UpdateStylePayload {
  block: AnyBlock;
  index: number;
  style: Style;
}

export class UpdateContainerStyle extends Command<UpdateStylePayload> {
  declare buffer: {
    oldStyle: Style;
  };
  execute(): void {
    const { block, index, style } = this.payload;
    const container = block.getEditable(index);

    const oldStyle: Style = {};
    for (const item in style) {
      oldStyle[item] = container.style[item];
    }
    this.buffer.oldStyle = oldStyle;
    Object.assign(container.style, style);
  }
  undo(): void {
    const { block, index } = this.payload;
    const container = block.getEditable(index);
    Object.assign(container.style, this.buffer.oldStyle);
  }
}

export class SetContainerAttribute extends Command<SetAttributePayload> {
  declare buffer: {
    oldValue: string | null;
  };
  execute(): void {
    const { block, index, name, value } = this.payload;
    const container = block.getEditable(index);

    this.buffer = {
      oldValue: container.getAttribute(name),
    };
    container.setAttribute(name, value);
  }
  undo(): void {
    const { block, index, name } = this.payload;
    const { oldValue } = this.buffer;
    const container = block.getEditable(index);
    if (!oldValue) {
      container.removeAttribute(name);
    } else {
      container.setAttribute(name, oldValue);
    }
  }
}
