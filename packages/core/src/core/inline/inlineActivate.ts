import {
  EventContext,
  Handler,
  HandlerOption,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import { getPrevLocation } from "@ohno-editor/core/system/range";
import { NodeInsert } from "@ohno-editor/core/contrib/commands/html";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";

import {
  parentElementWithFilter,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import { TextDelete } from "@ohno-editor/core/contrib/commands";
// import { InlineHandler } from "@ohno-editor/core/system/inline";

export type beforeInputHandler = (
  handler: InlineActivateHandler,
  e: TypedInputEvent,
  context: RangedEventContext
) => boolean;

export interface InlineHandlerOption {
  beforeInputHandler: beforeInputHandler[];
}

export class InlineActivateHandler
  extends Handler
  implements FineHandlerMethods
{
  declare option: InlineHandlerOption;
  constructor(option?: InlineHandlerOption) {
    super(option);
  }

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  findInlineBlock(node: Node, blockRoot: HTMLElement) {
    return parentElementWithTag(node, "label", blockRoot);
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { range, block } = context;
    let inline;

    if (
      range.collapsed &&
      (inline = this.findInlineBlock(
        range.startContainer,
        block.findEditable(range.startContainer)!
      ))
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
        page.setActiveInline();
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
    const { range, page } = context;
    let inline;
    if ((inline = this.instance.findInline(range.startContainer))) {
      this.instance.activate(context, inline);
    } else {
      page.setActiveInline();
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
        // const manager = page.getInlineManager<InlineMath>("inline_math")
        // const node = manager.create(text);
        // const offset = block.getOffset();
        // const offset.
        // const editable = block.findEditable(range.startContainer)!;
        const index = block.findEditableIndex(range.startContainer);
        const start =
          block.getBias([range.startContainer, range.startOffset]) -
          text.length -
          1;
        const command = new ListCommandBuilder({ block, page, node })
          .withLazyCommand(({ page, block }) => {
            return new TextDelete({
              page,
              block,
              start,
              index,
              token_number: text.length + 1,
            }).onExecute();
          })
          .withLazyCommand(({ page, block, node }) => {
            return new NodeInsert({
              page,
              block,
              start,
              index,
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
