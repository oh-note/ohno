import {
  isHintHTMLElement,
  isLeftButtonDown,
  isValidNode,
} from "@ohno-editor/core/system";
import {
  createRange,
  getValidAdjacent,
  isHintLeft,
  isInlineBlock,
  isParent,
  parentElementWithFilter,
  parentElementWithTag,
} from "@ohno-editor/core/system/functional";
import {
  AnyBlock,
  BlockEventContext,
  PagesHandleMethods,
  RangedBlockEventContext,
  RefLocation,
} from "@ohno-editor/core/system/types";

export function expandRangeToValid(
  block: AnyBlock,
  [node, offset]: RefLocation,
  direction: "left" | "right"
): RefLocation | void {
  const editable = block.findEditable(node);
  if (!editable) {
    // find nearest editable
    // return [node, offset];
    // throw new Error("?");

    return;
  }

  let hint;
  if ((hint = parentElementWithFilter(node, editable, isHintHTMLElement))) {
    if (isHintLeft(hint as HTMLElement)) {
      return getValidAdjacent(hint.parentElement as HTMLElement, "beforebegin");
    } else {
      return getValidAdjacent(hint.parentElement as HTMLElement, "afterend");
    }
  }

  let label;
  if ((label = parentElementWithTag(node, "label", editable))) {
    return getValidAdjacent(
      label,
      direction === "left" ? "beforebegin" : "afterend"
    );
  }

  if (isInlineBlock(node)) {
    return getValidAdjacent(
      node as HTMLLabelElement,
      direction === "left" ? "beforebegin" : "afterend"
    );
  }
  return;
}

export function defaultHandleMouseUp(
  handler: PagesHandleMethods,
  e: MouseEvent,
  context: BlockEventContext
) {
  const { range, block, page } = context;
  if (!range) {
    return;
  }

  const startLoc = expandRangeToValid(
    block,
    [range.startContainer, range.startOffset],
    "left"
  );

  const endLoc = range.collapsed
    ? startLoc
    : expandRangeToValid(
        context.isMultiBlock ? context.endBlock! : block,
        [range.endContainer, range.endOffset],
        "right"
      );
  if (startLoc && endLoc) {
    page.setRange(createRange(...startLoc, ...endLoc));
  } else if (startLoc) {
    page.setRange(
      createRange(...startLoc, range.endContainer, range.endOffset)
    );
  } else if (endLoc) {
    page.setRange(
      createRange(range.startContainer, range.startOffset, ...endLoc)
    );
  }
}
