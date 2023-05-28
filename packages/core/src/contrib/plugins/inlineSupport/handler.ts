/**
 * inline 组件在结构上属于 InlineSupport 插件的衍生组件。
 *
 * setActivated 和 edit 同时调用
 * setHovered 和 hover 同时调用
 */
import {
  BlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import { InlineSupport } from "./plugin";
import { getTagName } from "@ohno-editor/core/helper/element";
import { PagesHandleMethods, getValidAdjacent } from "@ohno-editor/core/system";
import { isPlain, tryGetDefaultRange } from "@ohno-editor/core/helper";

export class InlineSupportPluginHandler implements PagesHandleMethods {
  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, range, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      // TODO 将 page.setActivateInline 放到 InlineSupport 里
      // debugger;
      let label;
      if ((label = plugin.findInline(range.commonAncestorContainer, context))) {
        const handler = plugin.getInlineHandler(label);
        const isActivated = plugin.activeInline === label;
        if (isActivated) {
          // 激活状态下转发
          return handler.handleKeyDown?.(e, {
            ...context,
            inline: label,
            manager: plugin.getInlineManager(label),
          });
        }
        // 非激活状态下只有 Enter、Space 会进入激活状态，并将首次激活事件传递给 inline
        if (
          page.shortcut.equal(e, { code: "Enter" }) ||
          page.shortcut.equal(e, { code: "Space" })
        ) {
          const { unset } = plugin.setActiveInline(label);
          if (unset) {
            const unsetHandler = plugin.getInlineHandler(unset);
            unsetHandler.handleKeyboardDeActivated?.(e, {
              ...context,
              inline: unset,
              manager: plugin.getInlineManager(unset),
            });
          }
          handler.handleKeyboardActivated?.(e, {
            ...context,
            inline: label,
            manager: plugin.getInlineManager(label),
          });
          return true;
        }
        if (e.code === "Backspace") {
          page.setLocation(getValidAdjacent(label, "afterend"));
        } else if (e.code === "Delete") {
          page.setLocation(getValidAdjacent(label, "beforebegin"));
        } else if (!e.code.match(/Arrow/)) {
          // 箭头按键按箭头按键的行为，非箭头按键则
          page.setLocation(getValidAdjacent(label, "afterend"));
        } else {
          // 箭头，不做处理，由 defaultHandler 接管
          return;
        }
        return true;
      } else if (plugin.activeInline) {
        const { unset } = plugin.setActiveInline();
        if (unset) {
          const unsetHandler = plugin.getInlineHandler(unset);
          unsetHandler.handleKeyboardDeActivated?.(e, {
            ...context,
            inline: unset,
            manager: plugin.getInlineManager(unset),
          });
        }
        // this.deactivateInline(context);
      }

      return dispatchKeyEvent(this, e, context);
    }
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
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
          const plugin = page.getPlugin<InlineSupport>("inlinesupport");
          const { set, unset } = plugin.setHoveredInline(
            "cursor",
            neighbor[0] as HTMLLabelElement
          );
          if (unset) {
            const oldInlineHandler = plugin.getInlineHandler(unset);
            oldInlineHandler.handleKeyboardLeave?.(e, {
              ...context,
              inline: unset,
              manager: plugin.getInlineManager(unset),
            });
          }
          if (set) {
            const handler = plugin.getInlineHandler(set);
            handler.handleKeyboardEnter?.(e, {
              ...context,
              inline: set,
              manager: plugin.getInlineManager(set),
            });
          }
        }
      }
    }
  }

  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, range, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      let label;
      let set, unset;
      if ((label = plugin.findInline(range.commonAncestorContainer, context))) {
        const res = plugin.setHoveredInline("cursor", label);
        [set, unset] = [res.set, res.unset];
      } else {
        const res = plugin.setHoveredInline("cursor");
        [set, unset] = [res.set, res.unset];
      }

      if (unset) {
        const oldInlineHandler = plugin.getInlineHandler(unset);
        oldInlineHandler.handleKeyboardLeave?.(e, {
          ...context,
          inline: unset,
          manager: plugin.getInlineManager(unset),
        });
      }
      if (set) {
        const handler = plugin.getInlineHandler(set);
        handler.handleKeyboardEnter?.(e, {
          ...context,
          inline: set,
          manager: plugin.getInlineManager(set),
        });
      }
    }
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {
    console.log(["MouseDown"]);
    const { page, isMultiBlock } = context;
    if (!isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      let set, unset;
      if (node && (label = plugin.findInline(node, context))) {
        const res = plugin.setActiveInline(label);
        [set, unset] = [res.set, res.unset];
      } else if (!label && plugin.activeInline) {
        const res = plugin.setActiveInline();
        [set, unset] = [res.set, res.unset];
      }

      if (unset) {
        const oldInlineHandler = plugin.getInlineHandler(unset);
        oldInlineHandler.handleMouseDeActivated?.(e, {
          ...context,
          inline: unset,
          manager: plugin.getInlineManager(unset),
        });
      }
      // 首次激活，调用 handleMouseActivated
      if (set) {
        const handler = plugin.getInlineHandler(set);
        return handler.handleMouseActivated?.(e, {
          ...context,
          inline: set,
          manager: plugin.getInlineManager(set),
        });
      }
      // 如果已激活，则分发普通事件
      if (label) {
        const handler = plugin.getInlineHandler(label);
        return handler.handleMouseDown?.(e, {
          ...context,
          inline: label,
          manager: plugin.getInlineManager(label),
        });
      }
    }
  }

  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    console.log(["MouseUp"]);
    const { page, block, isMultiBlock } = context;
    // 理论上不需要 up 的激活事件，up 正常分发 up 即可
    const plugin = page.getPlugin<InlineSupport>("inlinesupport");
    // 鼠标没发现，此时如果默认的 mouseevent 定位在 label 里，说明可能遇到了inline 在尾部的行为，交由默认行为将光标移出去
    const range = tryGetDefaultRange();
    const node =
      range && range.collapsed
        ? document.elementFromPoint(e.clientX, e.clientY)
        : range?.commonAncestorContainer;
    let label;
    if (node && (label = plugin.findInline(node, context))) {
      if (label === plugin.activeInline) {
        const handler = plugin.getInlineHandler(label);
        return handler.handleMouseUp?.(e, {
          ...context,
          inline: label,
          manager: plugin.getInlineManager(label),
        });
      } else {
        // throw new Error("Saniti check");
        // 一些情况下（如 Mac 触控板）会出现MouseDown 后以非选中方式移动，并在 label 中触发 MouseUp
      }
    } else if (!label && plugin.activeInline) {
      {
        const { unset } = plugin.setHoveredInline("cursor");

        if (unset) {
          const oldInlineHandler = plugin.getInlineHandler(unset);
          oldInlineHandler.handleMouseLeave?.(e, {
            ...context,
            inline: unset,
            manager: plugin.getInlineManager(unset),
          });
        }
      }
      {
        const { unset } = plugin.setActiveInline();
        if (unset) {
          const unsetHandler = plugin.getInlineHandler(unset);
          unsetHandler.handleMouseDeActivated?.(e, {
            ...context,
            inline: unset,
            manager: plugin.getInlineManager(unset),
          });
        }
      }
    }
  }

  handleClick(e: MouseEvent, context: BlockEventContext): boolean | void {
    // click 是最后会被调用的鼠标事件，所以正常分发即可
    console.log(["Click"]);
    const { page, isMultiBlock } = context;
    const range = tryGetDefaultRange();

    const plugin = page.getPlugin<InlineSupport>("inlinesupport");
    const node =
      range && range.collapsed
        ? document.elementFromPoint(e.clientX, e.clientY)
        : range?.commonAncestorContainer;
    let label;

    if (node && (label = plugin.findInline(node, context))) {
      const handler = plugin.getInlineHandler(label);
      console.log([label, plugin.activeInline]);
      if (label === plugin.activeInline) {
        return handler.handleClick?.(e, {
          ...context,
          inline: label,
          manager: plugin.getInlineManager(label),
        });
      } else {
        return;
      }
    } else if (!label && plugin.activeInline) {
      throw new Error("Saniti check");
    }
  }

  handleCompositionStart(
    e: CompositionEvent,
    context: BlockEventContext
  ): boolean | void {
    // TODO dispatch composition to inline handler
  }
  handleCompositionUpdate(
    e: CompositionEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleCompositionEnd(
    e: CompositionEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { page, isMultiBlock } = context;
    if (e.button !== 1 && !isMultiBlock) {
      const plugin = page.getPlugin<InlineSupport>("inlinesupport");
      const node = document.elementFromPoint(e.clientX, e.clientY);
      let label;
      let set, unset;
      if (node && (label = plugin.findInline(node, context))) {
        const res = plugin.setHoveredInline("mouse", label);
        [set, unset] = [res.set, res.unset];
      } else {
        const res = plugin.setHoveredInline("mouse");
        [set, unset] = [res.set, res.unset];
      }

      if (unset) {
        const oldInlineHandler = plugin.getInlineHandler(unset);
        oldInlineHandler.handleMouseLeave?.(e, {
          ...context,
          inline: unset,
          manager: plugin.getInlineManager(unset),
        });
      }
      if (set) {
        const handler = plugin.getInlineHandler(set);
        handler.handleMouseEnter?.(e, {
          ...context,
          inline: set,
          manager: plugin.getInlineManager(set),
        });
      }
      if (label) {
        const handler = plugin.getInlineHandler(label);
        handler.handleMouseMove?.(e, {
          ...context,
          inline: label,
          manager: plugin.getInlineManager(label),
        });
      }
    }
  }

  handleMouseEnter(e: MouseEvent, context: BlockEventContext): boolean | void {
    // console.log(["Enter", context.block.type]);
  }
  handleMouseLeave(e: MouseEvent, context: BlockEventContext): boolean | void {
    // console.log(["Leave", context.block.type]);
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    const plugin = page.getPlugin<InlineSupport>("inlinesupport");

    if (plugin.activeInline) {
      const manager = plugin.getInlineManager(plugin.activeInline);
      const handler = plugin.getInlineHandler(plugin.activeInline);
      if (
        handler.handleInsideBeforeInput?.(e, {
          ...context,
          inline: plugin.activeInline,
          manager,
        })
      ) {
        return true;
      }
    } else if (plugin.findInline(range.commonAncestorContainer, context)) {
      throw new Error("Saniti Check");
    } else {
      const editable = block.findEditable(range.startContainer);
      if (editable && !isPlain(editable)) {
        const keys = Object.keys(plugin.inlineHandler);
        for (let i = 0; i < keys.length; i++) {
          if (plugin.inlineHandler[keys[i]].handleBeforeInput?.(e, context)) {
            return true;
          }
        }
      }
    }
  }
}
