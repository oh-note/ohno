import {
  BlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import { createRange, setLocation } from "@ohno-editor/core/system/range";
import { Table } from "./block";
import { TableChange, TableChangePayload } from "./command";
import { ST_ADD_DOWN, ST_ADD_RIGHT, ST_ADD_UP } from "./consts";
import { ST_ADD_LEFT } from "./consts";
import { BlockInvalideLocationEvent } from "@ohno-editor/core/system";
import { BlockReplace } from "../../commands";
import { Paragraph } from "../paragraph";
import { isLeftButtonDown, markActivate } from "@ohno-editor/core/helper";
import { copyInBlock } from "@ohno-editor/core/core/default/functional/copy";

export class TableHandler implements PagesHandleMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleContextMenu(e: MouseEvent, context: BlockEventContext): boolean | void {
    return true;
  }

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    const editable = block.findEditable(range.commonAncestorContainer);

    const res = page.shortcut.find(e);

    if (res.size === 0 || !editable) {
      return;
    }

    let axis, index;
    const [x, y] = (block as Table).getXYOfEditable(editable);
    if (res.has(ST_ADD_UP) || res.has(ST_ADD_DOWN)) {
      axis = "row";
      index = x;
    } else if (res.has(ST_ADD_LEFT) || res.has(ST_ADD_RIGHT)) {
      axis = "column";
      index = y;
    } else {
      return;
    }
    if (res.has(ST_ADD_DOWN) || res.has(ST_ADD_RIGHT)) {
      index++;
    }
    const command = new TableChange({
      page,
      block: block as Table,
      axis: axis as TableChangePayload["axis"],
      index,
    })
      .onExecute(({ axis, index, block }) => {
        const editable =
          axis === "row"
            ? block.getEditableByXY(index, y)!
            : block.getEditableByXY(x, index)!;
        setLocation(block.getLocation(0, editable)!);
      })
      .onUndo(({ axis, block }) => {
        const editable = block.getEditableByXY(x, y)!;
        setLocation(block.getLocation(0, editable)!);
      });
    page.executeCommand(command);
    return true;
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return true;
  }

  handleDeleteDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return true;
  }

  handleTabDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    const container = block.findEditable(range.commonAncestorContainer);
    if (container) {
      const next = e.shiftKey
        ? block.getPrevEditable(container)
        : block.getNextEditable(container);
      if (next) {
        const start = block.getLocation(0, next)!;
        const end = block.getLocation(-1, next)!;
        page.setRange(createRange(...start, ...end));
      }
    }

    return true;
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { block, range } = context;
    const typedBlock = block as Table;
    const node = document.elementFromPoint(e.clientX, e.clientY);
    if (node) {
      const editable = typedBlock.findTableCell(node)!;
      block.setStatus("startTableCell", editable);
      const startXY = typedBlock.getXYOfEditable(editable.querySelector("p")!);
      typedBlock.select(startXY, startXY);
    }

    if (node) {
      const end = typedBlock.findTableCell(node);
      const start = block.getStatus<HTMLElement>("startTableCell");
      if (start && end) {
        const startXY = typedBlock.getXYOfEditable(start.querySelector("p")!);
        const endXY = typedBlock.getXYOfEditable(end.querySelector("p")!);
        typedBlock.select(startXY, endXY);
      }
    }
  }
  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { block, range } = context;
    const typedBlock = block as Table;
    if (!isLeftButtonDown(e)) {
      return;
    }
    const node = document.elementFromPoint(e.clientX, e.clientY);

    if (node) {
      const end = typedBlock.findTableCell(node);
      const start = block.getStatus<HTMLElement>("startTableCell");
      if (start && end) {
        const startXY = typedBlock.getXYOfEditable(start.querySelector("p")!);
        const endXY = typedBlock.getXYOfEditable(end.querySelector("p")!);
        typedBlock.select(startXY, endXY);
      }
    }
  }

  handleMouseLeave(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { block, range } = context;
    const typedBlock = block as Table;
    typedBlock.clearSelect();
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // 向前合并
    // return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    const container = block.findEditable(range.commonAncestorContainer);
    if (container) {
      const next = e.shiftKey
        ? block.getPrevEditable(container)
        : block.getNextEditable(container);
      if (next) {
        const res = block.getLocation(0, next)!;
        page.setRange(createRange(...res));
      }
    } else {
      // 多选，清楚选中内容
    }

    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { block, range, page } = context;
    const editable = block.findEditable(range.commonAncestorContainer);

    if (editable) {
      return;
    }
    // select multiple table cell
  }

  handleCopy(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    copyInBlock;
  }
}
