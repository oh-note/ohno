import {
  RichTextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands/text";
import {
  UNIQUE_SPACE,
  createFlagNode,
  splitUniqueSpace,
} from "@ohno-editor/core/helper/document";
import {
  isHintHTMLElement,
  isHintLeft,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import {
  EventContext,
  Handler,
  RangedEventContext,
} from "@ohno-editor/core/system/handler";
import { tokenBetweenRange } from "@ohno-editor/core/system/position";
import {
  createRange,
  setLocation,
  setRange,
  validateRange,
} from "@ohno-editor/core/system/range";

export class CompositionHandler extends Handler {
  handleKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    if (e.isComposing) {
      return true;
    }
  }

  // 在 Start 的时候，可以通过重设光标来更改输入位置，但对 hint 边界的解决无效
  // Composition Start 用于解决输入时存在选中内容的情况
  handleCompositionStart(
    e: CompositionEvent,
    { block, range, page }: RangedEventContext
  ): boolean | void {
    validateRange(range);
    // CompositionHandler 先与 Block Container
    // 所以 CompositionHandler 的 Start 事件只处理非 multiblock（事件不会到这里），非 multi container （必须由 multi container block 自己处理）的情况
    if (block.isMultiEditable && !range.collapsed) {
      // throw new Error("Sanity check (should not be handled by this handler)");
      return false;
    }
    if (!range.collapsed) {
      // 删除选中文字
      // const command = new TextDelete
      // block.getBias
      const token_number = tokenBetweenRange(range);
      const editable = block.findEditable(range.startContainer);
      if (!editable) {
        throw new Error("editable not found.");
      }
      const start = block.getBias([range.startContainer, range.startOffset]);
      const index = block.getEditableIndex(editable);
      const command = new RichTextDelete({
        page,
        block,
        start,
        token_number,
        index,
      }).onExecute(({ block, index, start }) => {
        page.setLocation(block.getLocation(start, index)!, block);
      });
      page.executeCommand(command);
    }

    const cur = range.commonAncestorContainer;
    if (cur instanceof Text) {
      if (
        cur.textContent!.length === 0 &&
        (!cur.nextSibling || cur.nextSibling instanceof HTMLElement) &&
        (!cur.previousSibling || cur.previousSibling instanceof HTMLElement)
      ) {
        // 两边没有元素或者只有 HTML 元素
        console.log("1");
        const text = UNIQUE_SPACE;
        cur.replaceWith(text);
        range.setStart(text, 1);
        range.setEnd(text, 1);
      }
    } else if (cur instanceof HTMLLabelElement) {
      const nextLoc = block.getNextLocation([
        range.startContainer,
        range.startOffset,
      ])!;
      const next = createRange(...nextLoc);
      const text = UNIQUE_SPACE;
      next.insertNode(text);
      next.setStart(text, 1);
      next.setEnd(text, 1);
      setRange(next);
      page.setActiveInline(cur);
    } else {
      // console.log("3");
      // const text = createTextNode(" ");
      // range.insertNode(text);
      // range.setStart(text, 1);
      // range.setEnd(text, 1);
    }

    return true;
  }

  /**
   * 解决输入落点在 hint 内只需要在 end 时判定即可
   * - 只要有 start 和 update，无论以什么方式退出 composition，都一定会触发 end
   * - composition 无法在 beforeinput 取消，且 end 事件不会触发 input event，所以不方便使用 handleInput 进行管理
   * @param e
   * @param param1
   */
  handleCompositionEnd(
    e: CompositionEvent,
    { page, block, range }: RangedEventContext
  ): boolean | void {
    console.log(range.startContainer);
    splitUniqueSpace();
    const hint = range.startContainer.parentElement!;
    if (isHintHTMLElement(hint)) {
      const textChild = range.startContainer as Text;
      const right = textChild.splitText(range.startOffset - e.data!.length);
      if (isHintLeft(hint)) {
        hint.parentElement!.insertBefore(right, hint.nextSibling!);
      } else {
        const flag = createFlagNode();
        hint.parentElement!.insertAdjacentElement("afterend", flag);
        flag.replaceWith(right);
      }
      range.setStartAfter(right);
      range.setEndAfter(right);
    }
    const editable = block.findEditable(range.startContainer)!;

    const label = parentElementWithTag(
      range.startContainer,
      "label",
      block.root
    );
    const token_filter =
      label && range.startContainer != label ? () => false : undefined;

    const start =
      block.getBias([range.startContainer, range.startOffset], token_filter) -
      e.data!.length;
    const index = block.getEditableIndex(editable);

    const command = new TextInsert({
      page,
      block,
      innerHTML: e.data!,
      plain: true,
      start,
      index,
      token_filter,
    });

    page.executeCommand(command, true);
    return true;
  }
}
