import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import { getPrevLocation } from "@/system/range";
import { NodeInsert } from "@/contrib/commands/html";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { TextDeleteSelection } from "@/contrib/commands/text";
import {
  parentElementWithFilter,
  parentElementWithTag,
} from "@/helper/element";
// import { InlineHandler } from "@/system/inline";

export class InlineActivateHandler
  extends Handler
  implements KeyDispatchedHandler
{
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  findInlineBlock(node: Node, blockRoot: HTMLElement) {
    return parentElementWithTag(node, "label", blockRoot);
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { range } = context;
    let inline;

    if (
      range.collapsed &&
      (inline = this.findInlineBlock(range.startContainer))
    ) {
      // TODO 
      // this.instance.edit(context, inline);
      return true;
    }
  }

  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    const { range, page } = context;
    if (range?.collapsed) {
      if (this.instance.findInline(range.startContainer)) {
        return true;
      } else {
        this.instance.deactivate();
      }
    }
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {
    // Find instance ，get Handler 
    this.instance.hide();
  }

  handleClick(e: MouseEvent, context: EventContext): boolean | void {
    const { range } = context;
    let inline;
    if (range) {
      if ((inline = this.instance.findInline(range.startContainer))) {
        this.instance.edit(context, inline);
        return true;
      }
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { range } = context;
    let inline;
    if ((inline = this.instance.findInline(range.startContainer))) {
      this.instance.activate(context, inline);
    } else {
      this.instance.deactivate();
    }
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && e.data === "$") {
      const prev = getPrevLocation(range.startContainer, range.startOffset);
      if (!prev || !(prev[0] instanceof Text)) {
        return;
      }

      let matchIndex: number;
      if ((matchIndex = range.startContainer.textContent!.indexOf("$")) >= 0) {
        // 删除之前的 $，创建一个 Math
        const text = range.startContainer.textContent!.slice(
          matchIndex + 1,
          range.startOffset
        );
        const node = this.instance.create(text);
        const offset = block.getOffset();
        // const offset.
        const command = new ListCommandBuilder({ block, page, node, offset })
          .withLazyCommand(({ page, block, offset }) => {
            return new TextDeleteSelection({
              page,
              block,
              delOffset: {
                start: offset.start - text.length - 1,
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
                start: offset.start - text.length - 1,
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
