import {
  ValidNode,
  AnyBlock,
  Command,
  Page,
} from "@ohno/core/system/types";
import {
  createFlagNode,
  createTextNode,
  innerHTMLToNodeList,
} from "@ohno/core/system/functional";

export interface ContainerInsertPayload {
  page: Page;
  block: AnyBlock;
  index: number;
  newContainer: HTMLElement[];
  where: "above" | "below";
}

export interface ContainerRemovePayload {
  page: Page;
  block: AnyBlock;
  indexs: number[];
}

export class ContainerInsert extends Command<ContainerInsertPayload> {
  declare buffer: {
    newIndex: number[];
  };

  execute(): void {
    const { block, index, where, newContainer } = this.payload;

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
    const { block, indexs } = this.payload;
    // 逆序删除，顺序添加
    const deletedContainer = indexs
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
    const { block, indexs } = this.payload;
    // 顺序添加
    indexs.forEach((item, ind) => {
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
