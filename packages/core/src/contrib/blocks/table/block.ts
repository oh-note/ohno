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
import { markActivate, removeActivate } from "@ohno-editor/core/helper";
import { InlineData } from "@ohno-editor/core/system/inline";
export interface TableData extends BlockData {
  row: number;
  col: number;
  children?: InlineData[][];
}

export type CellCoord = [number, number];
export class Table extends Block<TableData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  rows!: HTMLTableRowElement[];
  table!: HTMLTableElement;
  // thead: HTMLTableSectionElement;
  tbody!: HTMLTableSectionElement;
  selectedEditables: HTMLElement[] = [];
  constructor(data?: TableData) {
    data = data || { row: 3, col: 3 };

    // 初始化

    super("table", data);
  }
  render(data: TableData): HTMLElement {
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
            const child = this.deserializeInline(rowChildren[cid]) || "";

            const cell = createElement("p", { children: child });
            return createElement("td", { children: [cell] });
          });
        const rowEl = createElement("tr", { children: tr });
        tbody.appendChild(rowEl);
        return rowEl;
      });
    root.appendChild(tableEl);
    tableEl.append(tbody);
    this.table = tableEl;
    // this.thead = thead;
    this.tbody = tbody;
    this.rows = table;

    return root;
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
  findTableCell(node: Node, raise?: boolean | undefined): HTMLElement | null {
    const tgt = parentElementWithTag(node, "td", this.root);
    if (raise && !tgt) {
      throw new Error("editable not found.");
    }
    return tgt;
  }

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

  getEditableByXY(rid: number, cid: number): HTMLElement {
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

  getXYOfEditable(el: HTMLElement): CellCoord {
    return [this.getRowId(el), this.getColId(el)];
  }

  getAreaOfTwoEditable(
    a: HTMLElement,
    b: HTMLElement
  ): { topleft: CellCoord; bottomright: CellCoord } {
    const [x1, y1] = this.getXYOfEditable(a);
    const [x2, y2] = this.getXYOfEditable(b);
    const [top, bottom] = y1 < y2 ? [y1, y2] : [y2, y1];
    const [left, right] = x1 < x2 ? [x1, x2] : [x2, x1];
    return { topleft: [top, left], bottomright: [bottom, right] };
  }
  getEditablesOfTwoEditable(a: HTMLElement, b: HTMLElement): HTMLElement[][] {
    const area = this.getAreaOfTwoEditable(a, b);
    const [top, left] = area.topleft;
    const [bottom, right] = area.bottomright;
    const res = [];
    for (let x = left; x <= right; x++) {
      const line = [];
      for (let y = top; y <= bottom; y++) {
        const editable = this.getEditableByXY(x, y);

        if (editable) {
          line.push(editable);
        }
      }
      res.push(line);
    }
    return res;
  }

  getLeftEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfEditable(el);
    if (y > 0) {
      return this.getEditableByXY(x, y - 1) as HTMLElement;
    }
    return null;
  }

  getRightEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfEditable(el);
    if (y < this.colNumber - 1) {
      return this.getEditableByXY(x, y + 1) as HTMLElement;
    }
    return null;
  }

  getAboveEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfEditable(el);
    if (x > 0) {
      return this.getEditableByXY(x - 1, y) as HTMLElement;
    }
    return null;
  }
  getBelowEditable(el?: HTMLElement) {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfEditable(el);
    if (x < this.rowNumber - 1) {
      return this.getEditableByXY(x + 1, y) as HTMLElement;
    }
    return null;
  }
  getPrevEditable(el?: HTMLElement | undefined): HTMLElement | null {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfEditable(el);
    if (y > 0) {
      return this.getEditableByXY(x, y - 1) as HTMLElement;
    } else if (x > 0) {
      return this.getEditableByXY(x - 1, this.colNumber - 1) as HTMLElement;
    }
    return null;
  }
  getNextEditable(el?: HTMLElement | undefined): HTMLElement | null {
    if (!el) {
      return null;
    }
    const [x, y] = this.getXYOfEditable(el);
    if (y < this.colNumber - 1) {
      return this.getEditableByXY(x, y + 1) as HTMLElement;
    } else if (x < this.rowNumber - 1) {
      return this.getEditableByXY(x + 1, 0) as HTMLElement;
    }
    return null;
  }

  getFirstEditable() {
    return this.getEditableByXY(0, 0) as HTMLElement;
  }
  getLastEditable() {
    return this.getEditableByXY(
      this.rowNumber - 1,
      this.colNumber - 1
    ) as HTMLElement;
  }
  getEditables(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("p"));
  }

  getEditableIndex(container: HTMLElement, reverse?: boolean): number {
    const [x, y] = this.getXYOfEditable(container);
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
  clearSelect() {
    this.selectedEditables.forEach((item) => removeActivate(item));
    this.selectedEditables = [];
  }
  updateSelect() {
    this.selectedEditables.forEach((item) => markActivate(item));
  }
  select([x1, y1]: CellCoord, [x2, y2]: CellCoord) {
    const [top, bottom] = y1 <= y2 ? [y1, y2] : [y2, y1];
    const [left, right] = x1 <= x2 ? [x1, x2] : [x2, x1];
    this.clearSelect();
    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        const editable = this.getEditableByXY(x, y);

        if (editable) {
          this.selectedEditables.push(editable.parentElement!);
        }
      }
    }
    this.updateSelect();
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

export default class TableSerializer extends BaseBlockSerializer<Table> {
  partToMarkdown(block: Table, range: Range): string {
    const { startEditable, endEditable } = this.rangedEditable(block, range);
    const tablecells = block.getEditablesOfTwoEditable(
      startEditable,
      endEditable
    );
    const lines: string[] = [];
    tablecells.forEach((rows, index) => {
      const lineStr = rows
        .map((item) => {
          return this.serializeInline(Array.from(item.childNodes), "markdown");
        })
        .join(" | ");
      lines.push(`| ${lineStr} |`);
      if (index === 0) {
        const lineStr = rows
          .map((item) => {
            return "---";
          })
          .join(" | ");
        lines.push(`| ${lineStr} |`);
      }
    });
    return "\n" + lines.join("\n") + "\n";
  }

  partToJson(block: Table, range: Range): BlockSerializedData<TableData> {
    const { startEditable, endEditable } = this.rangedEditable(block, range);
    const tablecells = block.getEditablesOfTwoEditable(
      startEditable,
      endEditable
    );
    return {
      type: block.type,
      data: {
        row: tablecells.length,
        col: tablecells[0].length,
        children: tablecells.map((row) => {
          return row.map((col) =>
            this.serializeInline(Array.from(col.childNodes), "json")
          );
        }),
      },
    };
  }
  toMarkdown(block: Table): string {
    const lines: string[] = [];
    block.cells.forEach((item, index) => {
      const cells: string[] = [];
      item.forEach((item) => {
        cells.push(
          this.serializeInline(Array.from(item.childNodes), "markdown")
        );
      });
      lines.push("| " + cells.join(" | ") + " |");
      if (index === 0) {
        lines.push("| " + cells.map(() => "---").join(" | ") + " |");
      }
    });
    return "\n" + lines.join("\n") + "\n";
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
          return row.map((col) =>
            this.serializeInline(Array.from(col.childNodes), "json")
          );
        }),
      },
    };
  }

  deserialize(data: BlockSerializedData<TableData>): Table {
    return new Table(data.data);
  }
}
