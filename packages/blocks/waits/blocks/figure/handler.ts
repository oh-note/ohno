import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
} from "../../../system/types";
import { Figure } from "./block";
import { BlockRemove, Empty, withNearestLocation } from "../../commands";
import { isEmpty, dispatchKeyEvent } from "../../../system/functional";

export class FigureHandler implements PagesHandleMethods {
  name: string = "figure";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // 向前合并
    const { block, range } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);
    if (!editable) {
      return true;
    }
    if (editable === typedBlock.img) {
      return true;
    }
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);
    if (!editable) {
      if (e.code === "ArrowRight" || e.code === "ArrowDown") {
        page.setLocation(block.getLocation(-1, -1)!);
        return true;
      } else {
        page.setLocation(block.getLocation(0, 0)!);
      }
    }
  }

  handleTabDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // 向前合并
    const { block, range } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);
    if (!editable) {
      return true;
    }
    if (editable === typedBlock.img) {
      return true;
    }
  }

  handleDeleteDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // 向前合并
    const { block, range, page } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);
    if (!editable) {
      const command = withNearestLocation(
        new BlockRemove({
          block,
          page,
        })
      ).onUndo(() => {
        page.setLocation(block.getLocation(0, 0)!);
      });
      page.executeCommand(command);
      return true;
    }

    let last = false;
    if (editable === typedBlock.img) {
      if (typedBlock.hasCaption) {
        page.setLocation(block.getLocation(0, -1)!);
      } else {
        last = true;
      }
    } else {
      if (
        typedBlock.isLocationInRight([range.startContainer, range.startOffset])
      ) {
        last = true;
      }
    }
    if (!last) {
      return;
    }
    const nextBlock = page.getNextBlock(block);
    if (!nextBlock) {
      return true;
    }
    page.setLocation(nextBlock.getLocation(0, 0)!);
    return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // 向前合并
    const { block, range, page } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);

    if (!editable || editable === typedBlock.img) {
      const command = withNearestLocation(
        new BlockRemove({
          block,
          page,
        })
      ).onUndo(() => {
        page.setLocation(block.getLocation(0, 0)!);
      });
      page.executeCommand(command);
      return true;
    }

    if (
      editable === typedBlock.figcaption &&
      range.collapsed &&
      typedBlock.isLocationInLeft([range.startContainer, range.startOffset])
    ) {
      if (isEmpty(typedBlock.figcaption)) {
        const command = new Empty({ block })
          .withExecute(() => {
            typedBlock.closeFigCaption();
          })
          .withUndo(() => {
            typedBlock.openFigCaption();
          })
          .onUndo(() => {
            page.setLocation(block.getLocation(0, -1)!);
          });
        page.executeCommand(command);
      }
      page.setLocation(block.getLocation(0, 0)!);
      return true;
    }
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // 向前合并
    const { block, range, page } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);
    if (!editable) {
      if (typedBlock.hasCaption) {
        page.setLocation(block.getLocation(0, -1)!);
      } else {
        page.setLocation(block.getLocation(0, 0)!);
      }
      return true;
    }

    if (editable === typedBlock.img && !e.shiftKey) {
      if (typedBlock.hasCaption) {
        page.setLocation(block.getLocation(0, -1)!);
      } else {
        const command = new Empty({ block })
          .withExecute(() => {
            typedBlock.openFigCaption();
          })
          .onExecute(() => {
            page.setLocation(block.getLocation(0, -1)!);
          })
          .withUndo(() => {
            typedBlock.closeFigCaption();
          })
          .onUndo(() => {
            page.setLocation(block.getLocation(0, 0)!);
          });
        page.executeCommand(command);
      }
      return true;
    }

    const nextBlock = page.getNextBlock(block);
    if (!nextBlock) {
      if (editable === typedBlock.img) {
        return true;
      } else {
        page.setLocation(block.getLocation(-1, -1)!);
        return true;
      }
    }

    page.setLocation(nextBlock.getLocation(0, 0)!);
    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // const { block, page, range } = context;
    // 向前合并
    const { block, range } = context;
    const typedBlock = block as Figure;
    const editable = typedBlock.findEditable(range.commonAncestorContainer);
    if (!editable) {
      return true;
    }
    if (editable === typedBlock.img) {
      return true;
    }
  }
  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { page, block, range } = context;
    const typedBlock = block as Figure;
    if (e.target === typedBlock.img && range && range.collapsed) {
      page.setLocation(block.getLocation(0, 0)!);
    }
  }
}
