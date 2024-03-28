import {
  isParent,
  dispatchKeyEvent,
} from "@ohno/core/system/functional";
import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockUpdateEvent,
} from "@ohno/core/system/types";

import { Equation } from "./block";
import { Paragraph } from "../paragraph";
import { BlockReplace } from "../../commands";

export class EquationHandler implements PagesHandleMethods {
  handleBlockUpdated(e: BlockUpdateEvent, context: any): boolean | void {
    const { page, block } = e;
    (block as Equation).update();
  }
  handleBlockActivated(e: BlockActiveEvent, context: any): boolean | void {
    const { block } = e;
    (block as Equation).floatMode();
  }
  handleBlockDeActivated(e: BlockDeActiveEvent, context: any): boolean | void {
    const { block } = e;
    (block as Equation).hideMode();
  }
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

  handleDeleteDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    return true;
  }

  handleTabDown(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    return true;
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { range, block, page } = context;
    const node = range
      ? range.startContainer
      : document.elementFromPoint(e.clientX, e.clientY)!;
    if (!node) {
      return;
    }
    if (!isParent(node, block.inner)) {
      const loc = block.getLocation(0, 0);
      page.setLocation(loc!, block);
      return true;
    }
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleEnterDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    const { page, block } = context;
    const next = page.getNextBlock(block);
    if (next) {
      page.setLocation(next.getLocation(0, 0)!, next);
    }
    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { range, page, block } = context;
    const editable = block.findEditable(range.commonAncestorContainer);

    if (!editable) {
      if (range.collapsed) {
        page.setLocation(block.getLocation(0, 0)!);
      } else {
        const newBlock = new Paragraph();
        const command = new BlockReplace({ page, block, newBlock });
        page.executeCommand(command);
        return true;
      }
      return;
    }
  }
  // handleBeforeInput(
  //   e: TypedInputEvent,
  //   context: RangedEventContext
  // ): boolean | void {

  //   return defaultHandleBeforeInputOfPlainText(this, e, context);
  //   // const { block, page, range } = context;
  //   // return true;
  // }
}
