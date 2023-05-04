import { createElement, getDefaultRange } from "@/helper/document";
import { indexOfNode, parentElementWithTag } from "@/helper/element";
import { Block, BlockInit } from "@/system/block";

export interface TableInit extends BlockInit {
  shape?: {
    row: number;
    col: number;
  };

  children?: HTMLLIElement[][];
}

export class Table extends Block<TableInit> {
  type: string = "table";
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  rows: HTMLTableRowElement[];
  table: HTMLTableElement;
  thead: HTMLTableSectionElement;
  tbody: HTMLTableSectionElement;
  constructor(init?: TableInit) {
    init = init || {};
    init.el = createElement("table", {
      attributes: {},
    });
    const { shape, children } = init;
    let row = -1,
      col = -1;
    if (shape) {
      row = shape.row;
      col = shape.col;
    }

    if (children) {
      row = Math.max(children.length, row);
      col = Math.max(children[0].length, col);
    }
    const tableEl = createElement("table");
    const thead = createElement("thead");
    const tbody = createElement("tbody");
    // 初始化
    const table = Array(row)
      .fill(0)
      .map((item, rid) => {
        const tr = Array(col)
          .fill(0)
          .map((item, cid) => {
            const cell = createElement("p");
            cell.innerHTML = "1";
            if (rid === 0) {
              return createElement("th", { children: [cell] });
              // return createElement("th", {  });
            } else {
              return createElement("td", { children: [cell] });
              // return createElement("td", {  });
            }
          });
        const row = createElement("tr", { children: tr });
        if (rid === 0) {
          thead.appendChild(row);
        } else {
          tbody.appendChild(row);
        }
        return row;
      });

    super(init);
    this.root.appendChild(tableEl);
    tableEl.append(thead, tbody);
    this.table = tableEl;
    this.thead = thead;
    this.tbody = tbody;
    this.rows = table;
  }

  public get rowNumber(): number {
    return 1 + this.tbody.childNodes.length;
  }

  public get colNumber(): number {
    return this.thead.querySelectorAll("th").length;
  }

  // 所有多 Container 下的 currentContainer 只考虑 range.startContainer 位置
  currentContainer() {
    // document.getSelection().focusNode
    const range = getDefaultRange();

    const p = parentElementWithTag(range.startContainer, "p", this.root);
    if (!p) {
      throw new Error(
        "Error when get currentContainer: focus are not in p element"
      );
    }
    return p;
  }

  findContainer(node: Node): HTMLElement | null {
    const tgt = parentElementWithTag(node, "p", this.root);
    return tgt;
  }

  getContainer(index?: number) {
    if (index === undefined) {
      throw new Error("must be number");
    }
    if (index < 0) {
      const res = this.root.querySelectorAll("p");
      return res[res.length + index];
    }
    // selector 从 1 开始，index 从 0 开始
    return this.root.querySelectorAll(`p`)[index] as HTMLElement;
  }

  getColId(el: HTMLElement) {
    // p -> td -> tr -> tbody/thead
    return indexOfNode(el.parentElement);
  }

  getRowId(el: HTMLElement) {
    // p -> td -> tr -> tbody/thead
    if (el.parentElement!.parentElement!.parentElement === this.thead) {
      return 0;
    } else {
      return indexOfNode(el.parentElement!.parentElement!) + 1;
    }
  }

  getContainerByXY(rid: number, cid: number) {
    if (rid === 0) {
      return this.thead.querySelector(`th:nth-child(${cid + 1})`)?.firstChild;
    } else {
      const row = this.tbody.childNodes[rid - 1] as HTMLElement;
      return row.querySelector(`td:nth-child(${cid + 1})`)?.firstChild;
    }
  }

  getXYOfContainer(el: HTMLElement): [number, number] {
    return [this.getRowId(el), this.getColId(el)];
  }

  leftContainer(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (y > 0) {
      return this.getContainerByXY(x, y - 1) as HTMLElement;
    }
    return null;
  }

  rightContainer(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (y < this.colNumber - 1) {
      return this.getContainerByXY(x, y + 1) as HTMLElement;
    }
    return null;
  }

  aboveContainer(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (x > 0) {
      return this.getContainerByXY(x - 1, y) as HTMLElement;
    }
    return null;
  }
  belowContainer(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (x < this.rowNumber - 1) {
      return this.getContainerByXY(x + 1, y) as HTMLElement;
    }
    return null;
  }
  prevContainer(el?: HTMLElement | undefined): HTMLElement | null {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (y > 0) {
      return this.getContainerByXY(x, y - 1) as HTMLElement;
    } else if (x > 0) {
      return this.getContainerByXY(x - 1, this.colNumber - 1) as HTMLElement;
    }
    return null;
  }
  nextContainer(el?: HTMLElement | undefined): HTMLElement | null {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (y < this.colNumber - 1) {
      return this.getContainerByXY(x, y + 1) as HTMLElement;
    } else if (x < this.rowNumber - 1) {
      return this.getContainerByXY(x + 1, 0) as HTMLElement;
    }
    return null;
  }

  firstContainer() {
    return this.getContainerByXY(0, 0) as HTMLElement;
  }
  lastContainer() {
    return this.getContainerByXY(
      this.rowNumber - 1,
      this.colNumber - 1
    ) as HTMLElement;
  }
  containers(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("p"));
  }

  getIndexOfContainer(container: HTMLElement, reverse?: boolean): number {
    const [x, y] = this.getXYOfContainer(container);
    return x * this.colNumber + y;
  }
}
