import {
  EventContext,
  Handler,
  HandlerMethods,
  FineHandlerMethods,
  MultiBlockEventContext,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import { InlineSupport } from "./plugin";
import { BlockCreate, BlockMove, BlocksMove } from "@/contrib/commands/block";
import { createRange, setLocation, setRange } from "@/system/range";
import { InlineRangedEventContext } from "@/system/handler";
import { getTagName } from "@/helper/element";

export class InlineSupportPluginHandler
  extends Handler
  implements FineHandlerMethods
{
  currentInline?: HTMLLabelElement;

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    const { page, range, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      let label;
      if ((label = plugin.findInline(range.commonAncestorContainer, context))) {
        const handler = plugin.getInlineHandler(label);
        const first = page.activeInline !== label;
        page.setActiveInline(label);
        return dispatchKeyEvent<InlineRangedEventContext>(handler, e, {
          ...context,
          inline: label,
          first,
          manager: plugin.getInlineManager(label),
        });
      } else if (page.activeInline) {
        this.deactivateInline(context);
      }

      return dispatchKeyEvent(this, e, context);
    }
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { block, range, page } = context;
    if (range.collapsed) {
      let neighbor;
      if (
        (e.key === "ArrowLeft" &&
          (neighbor = block.getPrevLocation([
            range.startContainer,
            range.startOffset,
          ]))) ||
        (e.key === "ArrowRight" &&
          (neighbor = block.getNextLocation([
            range.startContainer,
            range.startOffset,
          ])))
      ) {
        if (neighbor && getTagName(neighbor[0]) === "label") {
          const label = neighbor[0] as HTMLLabelElement;
          const plugin = page.getPlugin<InlineSupport>("inlinesupport");
          const handler = plugin.getInlineHandler(label);
          const first = page.activeInline !== label;
          page.setActiveInline(label);
          return dispatchKeyEvent<InlineRangedEventContext>(handler, e, {
            ...context,
            inline: label,
            first,
            manager: plugin.getInlineManager(label),
          });
          // return true;
        }
      }
    }
  }

  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    const { page, range, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      let label;
      if ((label = plugin.findInline(range.commonAncestorContainer, context))) {
        const handler = plugin.getInlineHandler(label);
        const first = page.activeInline !== label;
        page.setActiveInline(label);
        return dispatchKeyEvent<InlineRangedEventContext>(handler, e, {
          ...context,
          inline: label,
          first,
          manager: plugin.getInlineManager(label),
        });
      } else if (page.activeInline) {
        this.deactivateInline(context);
      }
    }
  }

  deactivateInline(context: EventContext) {
    const { page } = context;
    if (page.activeInline) {
      page.activeInline;
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      const manager = plugin.getInlineManager(page.activeInline);
      manager.exit();
      page.setActiveInline();
    }
  }

  handleClick(e: MouseEvent, context: EventContext): boolean | void {
    const { page, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      if (node && (label = plugin.findInline(node, context))) {
        const handler = plugin.getInlineHandler(label);
        const first = page.activeInline !== label;
        page.setActiveInline(label);
        return handler.handleClick?.(e, {
          ...context,
          inline: label,
          first,
          manager: plugin.getInlineManager(label),
        });
      } else if (!label && page.activeInline) {
        this.deactivateInline(context);
      }
    }
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {
    const { page, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      if (node && (label = plugin.findInline(node, context))) {
        const handler = plugin.getInlineHandler(label);
        const first = page.activeInline !== label;
        page.setActiveInline(label);
        return handler.handleMouseDown?.(e, {
          ...context,
          first,
          inline: label,
          manager: plugin.getInlineManager(label),
        });
      } else if (!label && page.activeInline) {
        this.deactivateInline(context);
      }
    }
  }

  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    const { page, block, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      // 鼠标没发现，此时如果默认的 mouseevent 定位在 label 里，说明可能遇到了inline 在尾部的行为，交由默认行为将光标移出去
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      if (node && (label = plugin.findInline(node, context))) {
        const handler = plugin.getInlineHandler(label);
        const first = page.activeInline !== label;
        page.setActiveInline(label);
        return handler.handleMouseUp?.(e, {
          ...context,
          first,
          inline: label,
          manager: plugin.getInlineManager(label),
        });
      } else if (!label && page.activeInline) {
        this.deactivateInline(context);
      }
    }
  }

  handleMouseMove(e: MouseEvent, context: EventContext): boolean | void {
    const { page, isMultiBlock } = context;
    if (e.button !== 1 && !isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      if (node && (label = plugin.findInline(node, context))) {
        const handler = plugin.getInlineHandler(label);
        if (this.currentInline !== label) {
          if (this.currentInline) {
            const oldInlineHandler = plugin.getInlineHandler(
              this.currentInline
            );
            oldInlineHandler.handleMouseLeave?.(e, {
              ...context,
              first: false,
              inline: this.currentInline,
              manager: plugin.getInlineManager(this.currentInline),
            });
          }
          this.currentInline = label;
          handler.handleMouseEnter?.(e, {
            ...context,
            first: false,
            inline: label,
            manager: plugin.getInlineManager(label),
          });
        }
      } else if (this.currentInline) {
        const oldInlineHandler = plugin.getInlineHandler(this.currentInline);
        oldInlineHandler.handleMouseLeave?.(e, {
          ...context,
          first: false,
          inline: this.currentInline,
          manager: plugin.getInlineManager(this.currentInline),
        });
        this.currentInline = undefined;
      }
    }
  }
  handleMouseEnter(e: MouseEvent, context: EventContext): boolean | void {
    console.log(["Enter", context.block.type]);
  }
  handleMouseLeave(e: MouseEvent, context: EventContext): boolean | void {
    console.log(["Leave", context.block.type]);
  }

  handleBeforeInput(
    e: InputEvent,
    context: RangedEventContext
  ): boolean | void {
    const { page } = context;
    const inline = page.getPlugin<InlineSupport>("inlinesupport");
    const keys = Object.keys(inline.inlineHandler);

    if (page.activeInline) {
      const manager = inline.getInlineManager(page.activeInline);
      const handler = inline.getInlineHandler(page.activeInline);
      if (
        handler.handleInsideBeforeInput?.(e, {
          ...context,
          first: false,
          inline: page.activeInline,
          manager,
        })
      ) {
        return true;
      }

      this.deactivateInline(context);
    } else {
      for (let i = 0; i < keys.length; i++) {
        if (inline.inlineHandler[keys[i]].handleBeforeInput?.(e, context)) {
          return true;
        }
      }
    }
  }
}
