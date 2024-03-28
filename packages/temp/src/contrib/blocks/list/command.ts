import { AnyBlock, Command, Page } from "@ohno/core/system/types";
import { ABCList } from "./block";
import { createFlagNode } from "@ohno/core/system/functional";

export interface DentPayload {
  page: Page;
  block: ABCList;
  indexs: number[];
  bias: number;
}

export class ListDentCommand extends Command<DentPayload> {
  declare buffer: {
    oldLevels: number[];
  };
  execute(): void {
    const { block, bias, indexs } = this.payload;

    const editables = indexs.map((item) => {
      return block.getEditable(item);
    });

    let bound = bias > 0 ? 0 : 10;
    const levels = editables.map((editable) => {
      const level = block.getIndentLevel(editable);
      if (bias > 0) {
        // indent
        bound = Math.max(bound, level);
      } else {
        // dedent
        bound = Math.min(bound, level);
      }
      return level;
    });
    if (bound + bias > 6 || bound + bias < 0) {
      return;
    }
    this.buffer = {
      oldLevels: levels,
    };

    editables.map((editable, index) => {
      const level = levels[index] + bias;
      block.setIndentLevel(editable as HTMLLIElement, level);
      return level;
    });

    block.updateValue();
  }
  undo(): void {
    if (!this.buffer) {
      return;
    }

    const { block, indexs } = this.payload;
    const levels = this.buffer.oldLevels;
    const editables = indexs.map((item) => {
      return block.getEditable(item);
    });
    editables.map((editable, index) => {
      const level = levels[index];
      block.setIndentLevel(editable as HTMLLIElement, level);
      return level;
    });

    block.updateValue();
  }
}

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
