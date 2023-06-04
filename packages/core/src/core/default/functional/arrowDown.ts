import { Page } from "@ohno-editor/core/system";
import {
  PagesHandleMethods,
  RangedBlockEventContext,
} from "@ohno-editor/core/system/handler";
import {
  RefLocation,
  compareLocation,
  createRange,
  getValidAdjacent,
} from "@ohno-editor/core/system/range";

export function setAnchor(
  tgt: Node,
  tgtOffset: number,
  range: Range,
  shiftKey: boolean,
  direction: "left" | "right",
  page: Page
) {
  /**在止点不动的情况下设置 Anchor Position */
  const next = createRange(tgt, tgtOffset);
  if (shiftKey) {
    if (direction === "left") {
      if (range.collapsed) {
        page.rangeDirection = "prev";
        next.setEnd(range.endContainer, range.endOffset);
      } else if (page.rangeDirection === "prev") {
        next.setEnd(range.endContainer, range.endOffset);
      } else {
        if (
          compareLocation(
            [tgt, tgtOffset],
            [range.startContainer, range.startOffset]
          ) === 1
        ) {
          page.rangeDirection = "prev";
          next.setEnd(range.startContainer, range.startOffset);
        } else {
          next.setStart(range.startContainer, range.startOffset);
        }
      }
    } else {
      if (range!.collapsed) {
        page.rangeDirection = "next";
        next.setStart(range.startContainer, range.startOffset);
      } else if (page.rangeDirection === "next") {
        next.setStart(range.startContainer, range.startOffset);
      } else {
        if (
          compareLocation(
            [tgt, tgtOffset],
            [range.endContainer, range.endOffset]
          ) === 1
        ) {
          next.setEnd(range.endContainer, range.endOffset);
        } else {
          page.rangeDirection = "next";
          next.setStart(range.endContainer, range.endOffset);
        }
      }
    }
  }
  page.setRange(next);
}

export function defaultHandleArrowDown(
  handler: PagesHandleMethods,
  e: KeyboardEvent,
  context: RangedBlockEventContext
): boolean | void {
  const { page, block, range } = context;
  let anchorBlock;
  let anchorLoc: RefLocation;
  const direction =
    e.key === "ArrowUp" || e.key === "ArrowLeft" ? "left" : "right";
  if (!e.shiftKey && !range.collapsed) {
    // 之前选中了，但这次按键没有选：取消
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      range.collapse(true);
      anchorLoc = [range.startContainer, range.startOffset];
      anchorBlock = block;
    } else {
      range.collapse();
      anchorLoc = [range.endContainer, range.endOffset];
      anchorBlock = context.endBlock || block;
    }

    page.rangeDirection = undefined;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      return true;
    }
  } else if (e.shiftKey) {
    // !range.collapsed
    // 之前选中了，但这次继续去选
    if (page.rangeDirection === "prev") {
      anchorLoc = [range.startContainer, range.startOffset];
      anchorBlock = block;
    } else {
      anchorLoc = [range.endContainer, range.endOffset];
      anchorBlock = context.endBlock || block;
    }
  } else if (range.collapsed) {
    // !e.shiftkey
    // 之前没选中，这次也不需要多选
    anchorLoc = [range.startContainer, range.startOffset];
    anchorBlock = block;
  } else {
    // e.shift && range.collpased
    // 之前没选中，这次要选
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      anchorLoc = [range.startContainer, range.startOffset];
      anchorBlock = block;
      page.rangeDirection = "prev";
    } else {
      anchorLoc = [range.startContainer, range.startOffset];
      anchorBlock = block;
      page.rangeDirection = "next";
    }
  }
  const [anchor, anchorOffset] = anchorLoc;

  const editable = anchorBlock.findEditable(anchor);
  if (!editable) {
    throw new EditableNotFound(anchor, anchorBlock.order);
  }
  if (e.key === "ArrowUp") {
    if (anchorBlock.isLocationInFirstLine(anchorLoc)) {
      const prevEditable = anchorBlock.getAboveEditable(editable);
      let prev;
      if (prevEditable) {
        const bias = anchorBlock.getBias(anchorLoc);
        const tempLoc = getValidAdjacent(prevEditable, "beforeend");
        prev = anchorBlock.getSoftLineLocation(tempLoc, bias);
        if (!prev) {
          prev = anchorBlock.getLocation(-1, prevEditable);
        }
      }
      if (!prev) {
        const prevBlock = page.getPrevBlock(anchorBlock);
        if (prevBlock) {
          // 激活，并且光标位移到上一个 block 的最后一行
          page.setActivate(prevBlock);
          const prevContainer = prevBlock.getLastEditable();
          const bias = anchorBlock.getBias(anchorLoc);
          const tempLoc = getValidAdjacent(prevContainer, "beforeend");
          prev = prevBlock.getSoftLineLocation(tempLoc, bias);
          if (!prev) {
            prev = prevBlock.getLocation(-1, prevContainer);
          }
        }
        // else {
        //   // block
        //   const [tgt, tgtOffset] = anchorBlock.getLocation(0, { index: 0 })!;
        //   setAnchor(tgt, tgtOffset);
        // }
      }
      if (prev) {
        setAnchor(...prev, range, e.shiftKey, direction, page);
      }

      return true;
    } else {
      const bias = anchorBlock.getSoftLineBias(anchorLoc);
      const nextLineHead = anchorBlock.getPrevLocation(
        anchorBlock.getSoftLineHead(anchorLoc)
      )!;
      let next = anchorBlock.getSoftLineLocation(nextLineHead, bias);

      if (!next) {
        // 默认行为是到当前 Editable 末尾
        next = anchorBlock.getLocation(-1, editable);
      }
      if (next) {
        setAnchor(...next, range, e.shiftKey, direction, page);
      }
      return true;
    }
  } else if (e.key === "ArrowDown") {
    if (anchorBlock.isLocationInLastLine(anchorLoc)) {
      const nextContainer = anchorBlock.getBelowEditable(editable);
      let next;

      if (nextContainer) {
        const bias = anchorBlock.getSoftLineBias(anchorLoc);
        next = anchorBlock.getLocation(bias, nextContainer);
        if (!next) {
          next = anchorBlock.getLocation(-1, nextContainer);
        }
      }
      if (!next) {
        const nextBlock = page.getNextBlock(anchorBlock);
        if (nextBlock) {
          // activate and move cursor to next block's first line
          const bias = anchorBlock.getSoftLineBias(anchorLoc);
          next = nextBlock.getLocation(bias, 0)!;
          if (!next) {
            next = nextBlock.getLocation(-1, 0)!;
          }
          page.setActivate(nextBlock);
        }
        // else {
        //   // end of the document
        //   const [tgt, tgtOffset] = anchorBlock.getLocation(-1, { index: -1 })!;
        // }
      }
      if (next) {
        setAnchor(...next, range, e.shiftKey, direction, page);
      }

      return true;
    } else {
      const bias = anchorBlock.getSoftLineBias(anchorLoc);
      const nextLineHead = anchorBlock.getNextLocation(
        anchorBlock.getSoftLineTail(anchorLoc)
      )!;
      let next = anchorBlock.getSoftLineLocation(nextLineHead, bias);

      if (!next) {
        next = anchorBlock.getLocation(-1, editable);
      }
      if (next) {
        setAnchor(...next, range, e.shiftKey, direction, page);
      }
      return true;
    }
  } else if (e.key === "ArrowLeft") {
    let prev;
    if (e.ctrlKey || e.metaKey) {
      prev = anchorBlock.getSoftLineHead(anchorLoc);
    } else if (e.altKey) {
      prev = anchorBlock.getPrevWordLocation(anchorLoc);
    } else {
      prev = anchorBlock.getPrevLocation(anchorLoc);
    }

    if (!prev) {
      const prevContainer = anchorBlock.getPrevEditable(editable);
      if (prevContainer) {
        prev = anchorBlock.getLocation(-1, prevContainer);
      }
    }

    if (!prev) {
      const prevBlock = page.getPrevBlock(anchorBlock);
      if (prevBlock) {
        page.setActivate(prevBlock);
        prev = prevBlock.getLocation(-1, prevBlock.getLastEditable());
      }
    }
    if (prev) {
      setAnchor(...prev, range, e.shiftKey, direction, page);
    }
    // 如果没有，则直接停在当前位置不动
    return true;
  } else if (e.key === "ArrowRight") {
    // 任何时候，因为 block 的复杂性
    let next;
    if (e.ctrlKey || e.metaKey) {
      next = anchorBlock.getSoftLineTail(anchorLoc);
    } else if (e.altKey) {
      next = anchorBlock.getNextWordLocation(anchorLoc);
    } else {
      next = anchorBlock.getNextLocation(anchorLoc);
    }

    if (!next) {
      // container right
      const nextContainer = anchorBlock.getNextEditable(editable);
      if (nextContainer) {
        next = anchorBlock.getLocation(0, nextContainer);
      }
    }
    if (!next) {
      const nextBlock = page.getNextBlock(anchorBlock);
      if (nextBlock) {
        page.setActivate(nextBlock);
        next = nextBlock.getLocation(0, 0);
      }
    }
    if (next) {
      setAnchor(...next, range, e.shiftKey, direction, page);
    }

    return true;
  }
}
