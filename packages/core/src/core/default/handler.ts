/**
 * 手动更新 hover、active 和 selection 状态，
 * 用于模拟 input 和 textarea 的 placeholder 和其他效果的更新
 */
import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  BlockInvalideLocationEvent,
} from "@ohno-editor/core/system/types";
import { defaultHandleArrowDown, setAnchor } from "./functional/arrowDown";
import {
  dispatchKeyEvent,
  createRange,
  compareLocation,
  parentElementWithFilter,
  copyInBlock,
} from "@ohno-editor/core/system/functional";
import {
  defaultHandleBeforeInput,
  defaultHandleBeforeInputOfPlainText,
} from "./functional/beforeInput";
import { isPlain } from "@ohno-editor/core/system/status";

import { defaultHandlePaste } from "./functional/paste";
import {
  FORMAT_MAP,
  ST_DELETE_SOFTLINE_FORWARD,
  ST_FORMAT_BOLD,
  ST_FORMAT_CODE,
  ST_FORMAT_ITALIC,
  ST_FORMAT_LINK,
  ST_MOVE_SOFT_END,
  ST_MOVE_SOFT_HEAD,
  ST_REDO,
  ST_SELECT_ALL,
  ST_UNDO,
} from "./consts";
import {
  BlockRemove,
  BlockReplace,
  FormatText,
  Paragraph,
  withNearestLocation,
} from "@ohno-editor/core/contrib";
import { ContextMenu } from "@ohno-editor/core/contrib/plugins/contextmenu/plugin";
import {
  defaultHandleMouseMove,
  defaultHandleMouseUp,
} from "./functional/mouse";

export class DefaultBlockHandler implements PagesHandleMethods {
  handleBlockInvalideLocation(
    e: BlockInvalideLocationEvent,
    context: BlockEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (range) {
      // const first = block.getFirstEditable();
      const last = block.getLastEditable();
      if (
        block.selection.compareLocationV2(
          [last, 0],
          [range.startContainer, range.startOffset],
          "left"
        )
      ) {
        page.setLocation(block.getLocation(-1, last)!);
      } else {
        page.setLocation(block.getLocation(0, 0)!);
      }
    }
  }
  handleClick(e: MouseEvent, context: BlockEventContext): boolean | void {}

  handleMouseEnter(e: MouseEvent, context: BlockEventContext): boolean | void {}

  handleMouseDown(
    e: MouseEvent,
    { block, page }: BlockEventContext
  ): boolean | void {
    // debugger;
    page.setActivate(block);
  }
  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    defaultHandleMouseUp(this, e, context);
  }

  handleMouseLeave(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {
    defaultHandleMouseMove(this, e, context);
  }

  handleHomeDown(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    this.moveToSoftlineBound(context, "left", e.shiftKey);
    return true;
  }

  handleEndDown(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    this.moveToSoftlineBound(context, "right", e.shiftKey);
    return true;
  }

  moveToSoftlineBound(
    { page, block, range }: BlockEventContext,
    direction: "left" | "right",
    shiftKey: boolean
  ) {
    if (!range) {
      throw new NoRangeError();
    }

    const container = block.findEditable(range.startContainer)!;

    const res =
      direction === "left"
        ? block.getSoftLineHead([range.startContainer, range.startOffset])
        : block.getSoftLineTail([range.startContainer, range.startOffset]);
    if (res) {
      const [boundContainer, boundOffset] = res;
      if (
        range.startContainer === boundContainer &&
        range.startOffset === boundOffset
      ) {
        const start =
          direction === "left"
            ? 0
            : block.selection.getTokenSize(container as HTMLElement);
        const loc = block.getLocation(start, container)!;

        setAnchor(...loc, range, shiftKey, direction, page);
      } else {
        setAnchor(
          boundContainer,
          boundOffset,
          range,
          shiftKey,
          direction,
          page
        );
      }
    }
  }

  handleContextMenu(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { page, block } = context;
    const plugin = page.getPlugin<ContextMenu>("contextmenu");
    plugin.span(e, context);

    return true;
  }

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // const { range, block } = context;
    const { page } = context;
    page.shortcut.match;
    if (dispatchKeyEvent(this, e, context)) {
      return true;
    }

    // else if (e.inputType === "formatBold" || e.inputType === "formatItalic") {
    //   const end = block.getBias([range.endContainer, range.endOffset]);
    //   command = new FormatText({
    //     page: page,
    //     block: block,
    //     format: e.inputType === "formatBold" ? "b" : "i",
    //     interval: {
    //       start,
    //       end,
    //       index,
    //     },
    //   });
    // }

    const st = page.shortcut;
    // debugger;
    const res = st.find(e);
    let hit;
    if ((hit = res.has(ST_UNDO))) {
      page.undoCommand();
    } else if ((hit = res.has(ST_REDO))) {
      page.redoCommand();
    } else if ((hit = res.has(ST_MOVE_SOFT_HEAD))) {
      this.moveToSoftlineBound(context, "left", e.shiftKey);
    } else if ((hit = res.has(ST_MOVE_SOFT_END))) {
      this.moveToSoftlineBound(context, "right", e.shiftKey);
    } else if ((hit = res.has(ST_SELECT_ALL))) {
      const { block, range } = context;
      const editable = block.findEditable(range.commonAncestorContainer);
      if (!editable) {
        // select all
        return;
      }
      // select single editable
      let startLoc = block.getLocation(0, editable)!;
      let endLoc = block.getLocation(-1, editable)!;
      if (
        compareLocation(startLoc, [range.startContainer, range.startOffset]) ===
          0 &&
        compareLocation(endLoc, [range.endContainer, range.endOffset]) === 0
      ) {
        if (block.isMultiEditable) {
          // select multiple editable
          const tgtRange = block.selection.createRange();
          tgtRange.selectNodeContents(block.root);
          page.setRange(tgtRange);
        } else {
          return;
        }
      } else {
        page.setRange(createRange(...startLoc, ...endLoc));
      }
    } else if (
      (hit = res.has(ST_FORMAT_BOLD)) ||
      (hit = res.has(ST_FORMAT_CODE)) ||
      (hit = res.has(ST_FORMAT_LINK)) ||
      (hit = res.has(ST_FORMAT_ITALIC))
    ) {
      const { block, range } = context;
      if (res.size > 1) {
        throw new Error("shortcut conflict");
      }
      const name = Array.from(res)[0];
      const format = FORMAT_MAP[name];
      const index = block.findEditableIndex(range.startContainer);
      const start = block.getBias([range.startContainer, range.startOffset]);
      const end = block.getBias([range.endContainer, range.endOffset]);
      const command = new FormatText({
        page: page,
        block: block,
        format,
        interval: {
          start,
          end,
          index,
        },
      });
      page.executeCommand(command);
    } else if ((hit = res.has(ST_DELETE_SOFTLINE_FORWARD))) {
      page.pageHandler.dispatchEvent(
        context,
        new InputEvent("beforeinput", { inputType: "deleteSoftLineForward" }),
        "handleBeforeInput"
      );
    }

    if (hit) {
      return true;
    }
    // else if (e.metaKey) {
    //   if (e.key === "z") {
    //     if (e.shiftKey) {
    //       context.page.history.redo();
    //     } else {
    //       context.page.history.undo();
    //     }
    //     e.preventDefault();
    //     e.stopPropagation();
    //   }
    // } else if (e.ctrlKey) {
    //   if (e.key === "a" || e.key === "e") {
    //     this.moveToSoftlineBound(context, e.key === "a" ? "left" : "right");
    //     return true;
    //   }
    // }
  }
  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    const editable = block.findEditable(range.commonAncestorContainer);

    if (!editable) {
      const startEditable = block.findEditable(range.startContainer);
      const endEditable = block.findEditable(range.endContainer);
      if (!startEditable && !endEditable) {
        const newBlock = new Paragraph();
        const command = new BlockReplace({ page, block, newBlock });
        page.executeCommand(command);
        return true;
      }
      // handled by multiblock handler or block handler
      return;
    }
    // editable

    if (
      isPlain(editable) ||
      parentElementWithFilter(range.startContainer, editable, (el) => {
        return el instanceof HTMLElement && isPlain(el);
      })
    ) {
      return defaultHandleBeforeInputOfPlainText(this, e, context);
    }
    return defaultHandleBeforeInput(this, e, context);
  }

  handleCopy(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    copyInBlock(e.clipboardData!, context);
    return true;
  }
  handleCut(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { range, block, page } = context;

    copyInBlock(e.clipboardData!, context);
    const editable = block.findEditable(range.commonAncestorContainer);
    if (!editable) {
      // handled by multiblock handler or block handler
      return;
    }
    if (range.collapsed) {
      const command = withNearestLocation(new BlockRemove({ block, page }));
      page.executeCommand(command);
      return true;
    }

    const inputEvent = new InputEvent("input", {
      inputType: "deleteContentBackward",
    }) as TypedInputEvent;

    if (
      isPlain(editable) ||
      parentElementWithFilter(range.startContainer, editable, (el) => {
        return el instanceof HTMLElement && isPlain(el);
      })
    ) {
      return defaultHandleBeforeInputOfPlainText(this, inputEvent, context);
    }
    return defaultHandleBeforeInput(this, inputEvent, context);
  }
  handlePaste(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // debugger;
    return defaultHandlePaste(this, e, context);
  }
}
