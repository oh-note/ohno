import {
  BlockEventContext,
  Handler,
  FineHandlerMethods,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import {
  createRange,
  setLocation,
  setRange,
} from "@ohno-editor/core/system/range";
import { Table } from "./block";
import { TableChange, TableChangePayload } from "./command";
import { ST_ADD_DOWN, ST_ADD_RIGHT, ST_ADD_UP } from "./consts";
import { ST_ADD_LEFT } from "./consts";

export class TableHandler extends Handler implements FineHandlerMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { range, block, page } = context;
    if (range) {
      if (
        range?.collapsed &&
        !block.findEditable(range!.commonAncestorContainer)
      ) {
        const container = block.getFirstEditable();
        page.setLocation(block.getLocation(0, container)!, block);
      }
    }
  }

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
    const [x, y] = (block as Table).getXYOfContainer(editable);
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
            ? block.getContainerByXY(index, y)!
            : block.getContainerByXY(x, index)!;
        setLocation(block.getLocation(0, editable)!);
      })
      .onUndo(({ axis, block }) => {
        const editable = block.getContainerByXY(x, y)!;
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
    const { block, range } = context;
    const container = block.findEditable(range.commonAncestorContainer);
    if (container) {
      const next = e.shiftKey
        ? block.getPrevEditable(container)
        : block.getNextEditable(container);
      if (next) {
        const start = block.getLocation(0, next)!;
        const end = block.getLocation(-1, next)!;
        setRange(createRange(...start, ...end));
      }
    }

    return true;
  }

  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {}
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
    const { block, range } = context;
    const container = block.findEditable(range.commonAncestorContainer);
    if (container) {
      const next = e.shiftKey
        ? block.getPrevEditable(container)
        : block.getNextEditable(container);
      if (next) {
        const res = block.getLocation(0, next)!;
        setRange(createRange(...res));
      }
    } else {
      // 多选，清楚选中内容
    }

    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: BlockEventContext
  ): boolean | void {
    // const { block, page, range } = context;
    // return true;
  }
}
