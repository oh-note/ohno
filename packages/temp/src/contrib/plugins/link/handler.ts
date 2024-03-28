import {
  BlockEventContext,
  RangedBlockEventContext,
  BlockSelectChangeEvent,
  PagesHandleMethods,
} from "@ohno/core/system/types";
import { Link } from "./plugin";
import { dispatchKeyEvent } from "@ohno/core/system/functional";

export class LinkPluginHandler implements PagesHandleMethods {
  currentInline?: HTMLLabelElement;

  handleBlockSelectChange(e: BlockSelectChangeEvent, context: any): void {
    const { range, block, page } = e;
    if (range) {
      const node = range.startContainer;
      const plugin = page.getPlugin<Link>("link");
      let label;
      if (node && (label = plugin.findInline(node, context))) {
        plugin.span(label, context);
      } else {
        plugin.close();
      }
    }
  }

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleTabDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, range } = context;
    const plugin = page.getPlugin<Link>("link");
    const node = range.startContainer;
    let label;
    if (node && (label = plugin.findInline(node, context))) {
      plugin.component.input.addEventListener(
        "focus",
        () => {
          plugin.component.input.setSelectionRange(0, -1);
        },
        {
          once: true,
        }
      );
      plugin.component.input.focus();
      return true;
    }
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const res = dispatchKeyEvent(this, e, context);
    if (res) {
      return res;
    }
    const { page, range } = context;
    const plugin = page.getPlugin<Link>("link");
    const node = range.startContainer;
    let label;
    if (node && (label = plugin.findInline(node, context))) {
      return;
    } else if (plugin.context) {
      plugin.close();
    }
  }

  handlePaste(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleClick(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { page, isMultiBlock } = context;
    if (!isMultiBlock) {
    }
  }

  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { page, isMultiBlock, range } = context;
    if (e.buttons !== 1 && !isMultiBlock) {
      const plugin = page.getPlugin<Link>("link");
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      if (node && (label = plugin.findInline(node, context))) {
        // console.log(e);
        // console.log("find link");
      }
    }
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
}
