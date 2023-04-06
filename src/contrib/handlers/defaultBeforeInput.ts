import {
  FIRST_POSITION,
  LAST_POSITION,
  rangeToOffset,
} from "../../helper/position";
import { EventContext, Handler, KeyDispatchedHandler } from "../../system/handler";

export function defaultBeforeInput(
  handler: Handler,
  e: KeyboardEvent,
  { page, block }: EventContext
): boolean | void {
  const range = document.getSelection()?.getRangeAt(0);
  if (!range) {
    return;
  }
  if (e.key === "ArrowUp") {
    if (block.isFirstLine(range)) {
      const offset = rangeToOffset(block.currentContainer(), range);
      const prevContainer = block.aboveContainer();
      if (prevContainer) {
        block.setInlinePositionAtLastLine(offset, prevContainer);
        return true;
      }

      const prevBlock = page.getPrevBlock(block);
      if (prevBlock) {
        // 激活，并且光标位移到上一个 block 的最后一行
        page.activate(prevBlock.order);
        prevBlock.setPosition(offset, prevBlock.lastContainer());
      } else {
        block.setPosition(FIRST_POSITION);
      }
      return true;
    }
  } else if (e.key === "ArrowDown") {
    // 在边界时处理，否则交给默认行为
    if (block.isLastLine(range)) {
      const offset = rangeToOffset(block.currentContainer(), range);
      // const offset = block.getInlinePosition(range);
      const nextContainer = block.belowContainer();
      if (nextContainer) {
        block.setPosition(offset, nextContainer);
        return true;
      }

      const nextBlock = page.getNextBlock(block);
      if (nextBlock) {
        // 激活，并且光标位移到上一个 block 的最后一行
        page.activate(nextBlock.order);
        nextBlock.setPosition(offset, nextBlock.firstContainer());
      } else {
        block.setPosition(LAST_POSITION);
      }
      return true;
    }
  } else if (e.key === "ArrowLeft") {
    // 任何时候，因为 block 的复杂性
    let prev: Range | null;
    if (!e.shiftKey) {
      range.collapse(true);
    }

    if (e.altKey) {
      prev = block.getPrevWordPosition(range);
    } else {
      prev = block.getPrevRange(range);
    }
    if (prev) {
      block.setRange(prev);
      return true;
    }
    const prevContainer = block.leftContainer(block.currentContainer());
    if (prevContainer) {
      block.setPosition(LAST_POSITION, prevContainer);
      return true;
    }

    const prevBlock = page.getPrevBlock(block);
    if (prevBlock) {
      page.activate(prevBlock.order);
      prevBlock.setPosition(LAST_POSITION, prevBlock.lastContainer());
    }
    // 如果没有，则直接停在当前位置不动
    return true;
  } else if (e.key === "ArrowRight") {
    // 任何时候，因为 block 的复杂性
    let next;

    if (!e.shiftKey) {
      range.collapse(false);
    }
    if (e.altKey) {
      next = block.getNextWordPosition(range);
    } else {
      next = block.getNextRange(range);
    }
    console.log(next);

    if (next) {
      block.setRange(next);
      return true;
    }

    const nextContainer = block.rightContainer(block.currentContainer());
    if (nextContainer) {
      block.setPosition(FIRST_POSITION, nextContainer);
      return true;
    }

    const nextBlock = page.getNextBlock(block);
    if (nextBlock) {
      page.activate(nextBlock.order);
      nextBlock.setPosition(FIRST_POSITION, nextBlock.lastContainer());
    }
    // 如果没有，则直接停在当前位置不动
    return true;
  }
}
