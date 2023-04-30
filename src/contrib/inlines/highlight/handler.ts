import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import { InlineMath } from "./instance";
import { locationToBias } from "@/system/position";
import { ValidNode, outerHTML, parentElementWithTag } from "@/helper/element";
import { createRange, getPrevLocation } from "@/system/range";
import { TextInsert } from "@/contrib/commands";
import { NodeInsert } from "@/contrib/commands/html";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { TextDeleteSelection } from "@/contrib/commands/text";
import { InlineHandler } from "@/system/inline";

export interface MathStatus {
  data: string;
  startBias: number;
  endBias: number;
}

export class HighlightHandler
  extends InlineHandler
  implements KeyDispatchedHandler
{
  status: MathStatus = {
    startBias: 0,
    endBias: 0,
    data: "",
  };
  declare instance: InlineMath;
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { range } = context;
    let inline;
    if ((inline = this.instance.findInline(range))) {
      this.instance.edit(context, inline);
      return true;
    }
  }
  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    const { range, page } = context;
    if (this.instance.findInline(range)) {
      return true;
    } else {
      this.instance.deactivate();
    }
  }

  handleClick(e: MouseEvent, context: EventContext): boolean | void {
    const { block, range, page } = context;
    let inline;
    if ((inline = this.instance.findInline(range))) {
      this.instance.edit(context, inline);
      return true;
    }
  }

  handleArrowKeyUp(e: KeyboardEvent, context: EventContext): boolean | void {
    const { range } = context;
    let inline;
    if ((inline = this.instance.findInline(range))) {
      this.instance.activate(context, inline);
    } else {
      this.instance.deactivate();
    }
  }

  handleBeforeInput(e: TypedInputEvent, context: EventContext): boolean | void {
    const { range, block, page } = context;
    if (!range) {
      throw new NoRangeError();
    }
    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && e.data === "$") {
      const prev = getPrevLocation(range.startContainer, range.startOffset);
      if (!prev || !(prev[0] instanceof Text)) {
        return;
      }
      const newRange = createRange(
        ...prev,
        range.startContainer,
        range.startOffset
      );
      if (newRange.cloneContents().textContent === "$") {
        // 删除之前的 $，创建一个 Math
        const node = this.instance.create("");
        const offset = block.getOffset();
        const command = new ListCommandBuilder({ block, page, node, offset })
          .withLazyCommand(({ page, block, offset }) => {
            return new TextDeleteSelection({
              page,
              block,
              delOffset: {
                start: offset.start - 1,
                end: offset.start,
                index: offset.index,
              },
            });
          })
          .withLazyCommand(({ page, block, offset, node }) => {
            return new NodeInsert({
              page,
              block,
              insertOffset: {
                start: offset.start - 1,
                index: offset.index,
              },
              node,
            });
          })
          .build();
        page.executeCommand(command);
        this.instance.edit(context, node);
        return true;
      }
    }
  }
}
