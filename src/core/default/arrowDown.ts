import { EventContext, Handler } from "@/system/handler";
import { createRange, getValidAdjacent, setRange } from "@/system/range";
import { ValidNode } from "@/helper/element";
import { getDefaultRange } from "@/helper/document";

export function defaultHandleArrowDown(
  handler: Handler,
  e: KeyboardEvent,
  context: EventContext
): boolean | void {
  const { page, block, range } = context;
  // let anchorBlock = context.endBlock || block;
  if (!range) {
    throw new NoRangeError();
  }
  let anchor, anchorOffset, anchorBlock;

  if (!e.shiftKey && !range.collapsed) {
    // 之前选中了，但这次按键没有选：取消
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      range.collapse(true);
      [anchor, anchorOffset] = [range.startContainer, range.startOffset];
      anchorBlock = block;
    } else {
      range.collapse();
      [anchor, anchorOffset] = [range.endContainer, range.endOffset];
      anchorBlock = context.endBlock || block;
    }
    page.status.selectionDir = undefined;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      return true;
    }
  } else if (e.shiftKey) {
    // !range.collapsed
    // 之前选中了，但这次继续去选
    if (page.status.selectionDir === "prev") {
      [anchor, anchorOffset] = [range.startContainer, range.startOffset];
      anchorBlock = block;
    } else {
      [anchor, anchorOffset] = [range.endContainer, range.endOffset];
      anchorBlock = context.endBlock || block;
    }
  } else if (range.collapsed) {
    // !e.shiftkey
    // 之前没选中，这次也不需要多选
    [anchor, anchorOffset] = [range.startContainer, range.startOffset];
    anchorBlock = block;
  } else {
    // e.shift && range.collpased
    // 之前没选中，这次要选
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      [anchor, anchorOffset] = [range.startContainer, range.startOffset];
      anchorBlock = block;
      page.status.selectionDir = "prev";
    } else {
      [anchor, anchorOffset] = [range.startContainer, range.startOffset];
      anchorBlock = block;
      page.status.selectionDir = "next";
    }
  }

  function setAnchor(tgt: Node, tgtOffset: number) {
    const next = createRange(tgt, tgtOffset);
    if (e.shiftKey) {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (range!.collapsed) {
          page.status.selectionDir = "prev";
          next.setEnd(range!.endContainer, range!.endOffset);
        } else if (page.status.selectionDir === "prev") {
          next.setEnd(range!.endContainer, range!.endOffset);
        } else {
          next.setStart(range!.startContainer, range!.startOffset);
        }
      } else {
        if (range!.collapsed) {
          page.status.selectionDir = "next";
          next.setStart(range!.startContainer, range!.startOffset);
        } else if (page.status.selectionDir === "next") {
          next.setStart(range!.startContainer, range!.startOffset);
        } else {
          next.setEnd(range!.endContainer, range!.endOffset);
        }
      }
    }
    setRange(next);
  }
  
  const container = anchorBlock.findContainer(anchor);
  if (!container) {
    throw new EditableNotFound(anchor, anchorBlock.order);
  }
  if (e.key === "ArrowUp") {
    if (anchorBlock.locationInFirstLine(anchor, anchorOffset)) {
      const prevContainer = anchorBlock.aboveContainer(container);
      let prev;
      if (prevContainer) {
        const bias = anchorBlock.getBias(anchor as ValidNode, anchorOffset);
        const [temp, tempOffset] = getValidAdjacent(prevContainer, "beforeend");
        prev = anchorBlock.getSoftLineLocation(temp, tempOffset, bias);
        if (!prev) {
          prev = anchorBlock.getLocation(-1, { container: prevContainer });
        }
      }
      if (!prev) {
        const prevBlock = page.getPrevBlock(anchorBlock);
        if (prevBlock) {
          // 激活，并且光标位移到上一个 block 的最后一行
          page.activate(prevBlock.order);
          const prevContainer = prevBlock.lastContainer();
          const bias = anchorBlock.getBias(anchor as ValidNode, anchorOffset);
          const [temp, tempOffset] = getValidAdjacent(
            prevContainer,
            "beforeend"
          );
          prev = prevBlock.getSoftLineLocation(temp, tempOffset, bias);
          if (!prev) {
            prev = prevBlock.getLocation(-1, { container: prevContainer });
          }
        }
        // else {
        //   // block
        //   const [tgt, tgtOffset] = anchorBlock.getLocation(0, { index: 0 })!;
        //   setAnchor(tgt, tgtOffset);
        // }
      }
      if (prev) {
        setAnchor(...prev);
      }

      return true;
    } else {
      const bias = anchorBlock.getSoftLineBias(anchor, anchorOffset);
      const nextLineHead = anchorBlock.getPrevLocation(
        ...anchorBlock.getSoftLineHead(anchor, anchorOffset)
      )!;
      let next = anchorBlock.getSoftLineLocation(...nextLineHead, bias);

      if (!next) {
        next = anchorBlock.getLocation(-1, { container });
      }
      if (next) {
        setAnchor(...next);
      }
      return true;
    }
  } else if (e.key === "ArrowDown") {
    if (anchorBlock.locationInLastLine(anchor, anchorOffset)) {
      const nextContainer = anchorBlock.belowContainer(container);
      let next;

      if (nextContainer) {
        const bias = anchorBlock.getSoftLineBias(anchor, anchorOffset);
        next = anchorBlock.getLocation(bias, { container: nextContainer });
        if (!next) {
          next = anchorBlock.getLocation(-1, { container: nextContainer });
        }
      }
      if (!next) {
        const nextBlock = page.getNextBlock(anchorBlock);
        if (nextBlock) {
          // activate and move cursor to next block's first line
          page.activate(nextBlock.order);
          const bias = anchorBlock.getSoftLineBias(anchor, anchorOffset);
          next = nextBlock.getLocation(bias, { index: 0 })!;
          if (!next) {
            next = nextBlock.getLocation(-1, { index: 0 })!;
          }
        }
        // else {
        //   // end of the document
        //   const [tgt, tgtOffset] = anchorBlock.getLocation(-1, { index: -1 })!;
        // }
      }
      if (next) {
        setAnchor(...next);
      }

      return true;
    } else {
      const bias = anchorBlock.getSoftLineBias(anchor, anchorOffset);
      const nextLineHead = anchorBlock.getNextLocation(
        ...anchorBlock.getSoftLineTail(anchor, anchorOffset)
      )!;
      let next = anchorBlock.getSoftLineLocation(...nextLineHead, bias);

      if (!next) {
        next = anchorBlock.getLocation(-1, { container });
      }
      if (next) {
        setAnchor(...next);
      }
      return true;
    }
  } else if (e.key === "ArrowLeft") {
    let prev;
    if (e.altKey) {
      prev = anchorBlock.getPrevWordLocation(anchor, anchorOffset);
    } else {
      prev = anchorBlock.getPrevLocation(anchor, anchorOffset);
    }

    if (!prev) {
      const prevContainer = anchorBlock.prevContainer(container);
      if (prevContainer) {
        prev = anchorBlock.getLocation(-1, { container: prevContainer });
      }
    }

    if (!prev) {
      const prevBlock = page.getPrevBlock(anchorBlock);
      if (prevBlock) {
        page.activate(prevBlock.order);
        prev = prevBlock.getLocation(-1, { index: -1 });
      }
    }
    if (prev) {
      setAnchor(...prev);
    }
    // 如果没有，则直接停在当前位置不动
    return true;
  } else if (e.key === "ArrowRight") {
    // 任何时候，因为 block 的复杂性
    let next;

    if (e.altKey) {
      next = anchorBlock.getNextWordLocation(anchor, anchorOffset);
    } else {
      next = anchorBlock.getNextLocation(anchor, anchorOffset);
    }

    if (!next) {
      // container right
      const nextContainer = anchorBlock.nextContainer(container);
      if (nextContainer) {
        next = anchorBlock.getLocation(0, { container: nextContainer });
      }
    }
    if (!next) {
      const nextBlock = page.getNextBlock(anchorBlock);
      if (nextBlock) {
        page.activate(nextBlock.order);
        next = nextBlock.getLocation(0, { index: 0 });
      }
    }
    if (next) {
      setAnchor(...next);
    }

    return true;
  }
}
