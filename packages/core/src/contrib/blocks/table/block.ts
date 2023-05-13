import { createElement, getDefaultRange } from "@/helper/document";
import { indexOfNode, parentElementWithTag } from "@/helper/element";
import { BlockSerializedData, EditableFlag } from "@/system/base";
import { Block, BlockInit } from "@/system/block";
import "./style.css";
export interface TableInit extends BlockInit {
  shape?: {
    row: number;
    col: number;
    innerHTMLs?: (string | undefined)[][];
  };

  children?: HTMLParagraphElement[][];
}

export class Table extends Block<TableInit> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  rows: HTMLTableRowElement[];
  table: HTMLTableElement;
  // thead: HTMLTableSectionElement;
  tbody: HTMLTableSectionElement;
  constructor(init?: TableInit) {
    init = init || {};
    init.el = createElement("table", {
      attributes: {},
    });
    const { children } = init;
    let shape = init.shape;

    if (children && shape) {
      throw new Error("children and shape should assign only one at once.");
    }

    const tableEl = createElement("table");
    // const thead = createElement("thead");
    const tbody = createElement("tbody");
    let table;
    if (children) {
      table = children.map((row, rid) => {
        const tr = row.map((cellEl, cid) => {
          return createElement("td", { children: [cellEl] });
        });
        const rowEl = createElement("tr", { children: tr });
        tbody.appendChild(rowEl);
        return rowEl;
      });
    }

    if (!shape) {
      shape = { row: 3, col: 3 };
    }

    const { row, col, innerHTMLs } = shape;
    table = Array(row)
      .fill(0)
      .map((_, rid) => {
        const rowInnerHTMLs = (innerHTMLs && innerHTMLs[rid]) || [];
        const tr = Array(col)
          .fill(0)
          .map((_, cid) => {
            const cellInnerHTML = rowInnerHTMLs[cid] || "";
            const cell = createElement("p");
            cell.innerHTML = cellInnerHTML;
            return createElement("td", { children: [cell] });
            // if (rid === 0) {
            //   return createElement("th", { children: [cell] });
            // } else {
            // }
          });
        const rowEl = createElement("tr", { children: tr });
        tbody.appendChild(rowEl);
        return rowEl;
      });

    // 初始化

    super("table", init);
    this.root.appendChild(tableEl);
    tableEl.append(tbody);
    this.table = tableEl;
    // this.thead = thead;
    this.tbody = tbody;
    this.rows = table;
  }

  public get inner(): HTMLElement {
    return this.table;
  }

  public get rowNumber(): number {
    return this.tbody.childNodes.length;
  }

  public get colNumber(): number {
    return this.tbody.firstElementChild!.querySelectorAll("td").length;
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

  findEditable(node: Node): HTMLElement | null;
  findEditable(node: Node, raise?: boolean | undefined): HTMLElement;
  findEditable(node: Node, raise?: boolean | undefined): HTMLElement | null {
    const tgt = parentElementWithTag(node, "p", this.root);
    if (raise && !tgt) {
      throw new Error("editable not found.");
    }
    return tgt;
  }

  getContainer(index?: number) {}
  getEditable(flag: EditableFlag): HTMLElement {
    if (typeof flag === "number") {
      if (flag === undefined) {
        throw new Error("must be number");
      }
      if (flag < 0) {
        const res = this.root.querySelectorAll("p");
        return res[res.length + flag];
      }
      // selector 从 1 开始，index 从 0 开始
      return this.root.querySelectorAll(`p`)[flag] as HTMLElement;
    }
    return flag;
  }

  getColId(el: HTMLElement) {
    // p -> td -> tr -> tbody/thead
    return indexOfNode(el.parentElement);
  }

  getRowId(el: HTMLElement) {
    // p -> td -> tr -> tbody/thead
    return indexOfNode(el.parentElement!.parentElement!);
    // if (el.parentElement!.parentElement!.parentElement === this.thead) {
    //   return 0;
    // } else {
    //   return indexOfNode(el.parentElement!.parentElement!) + 1;
    // }
  }

  getContainerByXY(rid: number, cid: number): HTMLElement {
    const row = this.tbody.childNodes[rid] as HTMLElement;
    return row.querySelector(`td:nth-child(${cid + 1})`)
      ?.firstElementChild as HTMLElement;
    // if (rid === 0) {
    //   return this.thead.querySelector(`th:nth-child(${cid + 1})`)?.firstChild;
    // } else {
    //   const row = this.tbody.childNodes[rid - 1] as HTMLElement;
    //   return row.querySelector(`td:nth-child(${cid + 1})`)?.firstChild;
    // }
  }

  getXYOfContainer(el: HTMLElement): [number, number] {
    return [this.getRowId(el), this.getColId(el)];
  }

  getLeftEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (y > 0) {
      return this.getContainerByXY(x, y - 1) as HTMLElement;
    }
    return null;
  }

  getRightEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (y < this.colNumber - 1) {
      return this.getContainerByXY(x, y + 1) as HTMLElement;
    }
    return null;
  }

  getAboveEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (x > 0) {
      return this.getContainerByXY(x - 1, y) as HTMLElement;
    }
    return null;
  }
  getBelowEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfContainer(el);
    if (x < this.rowNumber - 1) {
      return this.getContainerByXY(x + 1, y) as HTMLElement;
    }
    return null;
  }
  getPrevEditable(el?: HTMLElement | undefined): HTMLElement | null {
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
  getNextEditable(el?: HTMLElement | undefined): HTMLElement | null {
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

  getFirstEditable() {
    return this.getContainerByXY(0, 0) as HTMLElement;
  }
  getLastEditable() {
    return this.getContainerByXY(
      this.rowNumber - 1,
      this.colNumber - 1
    ) as HTMLElement;
  }
  getEditables(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("p"));
  }

  getEditableIndex(container: HTMLElement, reverse?: boolean): number {
    const [x, y] = this.getXYOfContainer(container);
    return x * this.colNumber + y;
  }

  serialize(option?: any): BlockSerializedData<TableInit> {
    const init = {
      shape: {
        col: this.colNumber,
        row: this.rowNumber,
        innerHTMLs: this.rows.map((item) => {
          const cellEl = item.querySelectorAll("p");
          return Array.from(cellEl).map((item) => item.innerHTML);
        }),
      },
    };
    return [{ type: this.type, init, unmergeable: true }];
  }

  addRow(index: number) {
    const old = this.rows[index];
    const newRow = Array(this.colNumber)
      .fill(0)
      .map((_, cid) => {
        const cell = createElement("p");
        return createElement("td", { children: [cell] });
      });

    const rowEl = createElement("tr", { children: newRow });
    if (old) {
      this.tbody.insertBefore(rowEl, old);
    } else {
      this.tbody.appendChild(rowEl);
    }
    this.rows.splice(index, 0, rowEl);
  }

  addColumn(index: number) {
    this.rows.forEach((item) => {
      const old = item.childNodes[index];
      const cell = createElement("p");
      const cellEl = createElement("td", { children: [cell] });
      if (old) {
        item.insertBefore(cellEl, old);
      } else {
        item.appendChild(cellEl);
      }
    });
  }

  removeColummn(index: number): HTMLElement[] {
    return this.rows.map((item) => {
      const old = item.childNodes[index];
      old.remove();
      return old as HTMLElement;
    });
  }
  removeRow(index: number): HTMLElement {
    const snap = this.tbody.childNodes[index] as HTMLElement;
    this.tbody.childNodes[index].remove();
    this.rows.splice(index, 1);
    return snap;
  }
}
