import {
  ChildrenData,
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  indexOfNode,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import {
  BaseBlockSerializer,
  BlockSerializedData,
  EditableFlag,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import "./style.css";
export interface TableData extends BlockData {
  row: number;
  col: number;
  children?: ChildrenData[][];
}

export class Table extends Block<TableData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  rows: HTMLTableRowElement[];
  table: HTMLTableElement;
  // thead: HTMLTableSectionElement;
  tbody: HTMLTableSectionElement;
  constructor(data?: TableData) {
    data = data || { row: 3, col: 3 };
    const root = createElement("table", {
      attributes: {},
    });
    const { children } = data;

    const tableEl = createElement("table");
    // const thead = createElement("thead");
    const tbody = createElement("tbody");

    const { row, col } = data;
    const table = Array(row)
      .fill(0)
      .map((_, rid) => {
        const rowChildren = (children && children[rid]) || [];
        const tr = Array(col)
          .fill(0)
          .map((_, cid) => {
            const child = rowChildren[cid] || "";
            const cell = createElement("p", { children: child });
            return createElement("td", { children: [cell] });
          });
        const rowEl = createElement("tr", { children: tr });
        tbody.appendChild(rowEl);
        return rowEl;
      });

    // 初始化

    super("table", root);
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

  public get cells(): HTMLElement[][] {
    return this.rows.map((item) => {
      const old = Array.from(item.childNodes).map(
        (item) => (item as HTMLElement).querySelector("p")!
      );
      return old;
    });
  }
}

export class TableSerializer extends BaseBlockSerializer<Table> {
  toMarkdown(block: Table): string {
    return "> " + block.root.textContent + "\n";
  }
  toHTML(block: Table): string {
    return this.outerHTML(block.root);
  }
  toJson(block: Table): BlockSerializedData<TableData> {
    return {
      type: block.type,
      data: {
        row: block.rowNumber,
        col: block.colNumber,
        children: block.cells.map((row) => {
          return row.map((col) => col.innerHTML);
        }),
      },
    };
  }

  deserialize(data: BlockSerializedData<TableData>): Table {
    return new Table(data.data);
  }
}
