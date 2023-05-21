import {
  MultiBlockEventContext,
  Handler,
  FineHandlerMethods,
  RangedBlockEventContext,
} from "@ohno-editor/core/system/handler";
import { defaultHandleArrowDown } from "../default/functions/arrowDown";
import {
  createRange,
  normalizeContainer,
  setRange,
} from "@ohno-editor/core/system/range";
import { OhNoClipboardData } from "@ohno-editor/core/system/base";

export class BlockModeHandler extends Handler implements FineHandlerMethods {
  handleCopy(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const { blocks, block, endBlock, range } = context;
    const data = blocks.map((curBlock) => {
      let text, html, json;
      text = curBlock.toMarkdown(range);
      html = curBlock.toHTML(range);
      json = curBlock.serialize(range);
      return { text: text, html: html, json: json };
    });
    const markdown = data.map((item) => item.text).join("\n");
    const html = data.map((item) => item.html).join("");
    const json: OhNoClipboardData = {
      data: data.flatMap((item) => item.json),
      inline: false,
    };

    e.clipboardData!.setData("text/plain", markdown);
    e.clipboardData!.setData("text/html", html);
    e.clipboardData!.setData("text/ohno", JSON.stringify(json));

    return true;
  }

  handleBlur(e: FocusEvent, context: MultiBlockEventContext): void | boolean {
    console.log("handleBlur", e, context.block);
  }
  handleEnterDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {
    return true;
  }
  handleKeyDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {}

  handleKeyPress(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleKeyPress", e, context.block);
  }
  handleKeyUp(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleKeyUp", e, context.block);
  }
  handleMouseDown(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseDown", e, context.block);
  }
  handleMouseEnter(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseEnter", e, context.block);
  }
  handleMouseMove(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseMove", e, context.block);
  }
  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleMouseLeave(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseLeave", e, context.block);
  }
  handleMouseUp(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseUp", e, context.block);
    const { block, endBlock, range, page } = context;
    const startRoot = block.findEditable(range.startContainer)!;
    const endRoot = endBlock.findEditable(range.endContainer)!;
    range.startOffset, range.endOffset;
    const [startContainer, startOffset] = normalizeContainer(
      startRoot,
      range.startContainer,
      range.startOffset,
      "left"
    );
    const [endContainer, endOffset] = normalizeContainer(
      endRoot,
      range.endContainer,
      range.endOffset,
      "right"
    );
    setRange(createRange(startContainer, startOffset, endContainer, endOffset));

    page.rangeDirection = "next";
    return true;
  }
  handleClick(e: MouseEvent, context: MultiBlockEventContext): void | boolean {
    console.log("handleClick", e, context.block);
  }
  handleContextMenu(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleContextMenu", e, context.block);
  }
  handleInput(e: Event, context: MultiBlockEventContext): void | boolean {
    console.log("handleInput", e, context.block);
  }
  handleBeforeInput(
    e: TypedInputEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    return true;
  }
  handleCompositionEnd(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleCompositionEnd", e, context.block);
  }
  handleCompositionStart(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    return true;
  }
  handleCompositionUpdate(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {}
}
