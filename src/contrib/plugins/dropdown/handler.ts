import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
} from "@/system/handler";
import { Dropdown } from "./instance";
import { locationToBias } from "@/system/position";
import { ValidNode } from "@/helper/element";

export interface DropdownStatus {
  data: string;
  startBias: number;
  endBias: number;
}

export class DropdownHandler extends Handler implements KeyDispatchedHandler {
  status: DropdownStatus = {
    startBias: 0,
    endBias: 0,
    data: "",
  };
  dropdown: Dropdown;

  constructor({ dropdown }: { dropdown: Dropdown }) {
    super();
    this.dropdown = dropdown;
    this.dropdown.assignPage;
  }

  clearStatus() {
    this.status = {
      startBias: 0,
      endBias: 0,
      data: "",
    };
  }
  handleKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  handleEnterDown(e: KeyboardEvent, { page }: EventContext): boolean | void {
    const dropdown = page.getPlugin("dropdown").instance as Dropdown;
    if (!dropdown.isOpen) {
      return;
    }
    if (dropdown.onSelect()) {
      dropdown.close();
      return true;
    }
    dropdown.close();
  }
  handleEscapeDown(e: KeyboardEvent, { page }: EventContext): boolean | void {
    const dropdown = page.getPlugin("dropdown").instance as Dropdown;
    if (!dropdown.isOpen) {
      return;
    }
    dropdown.close();
    return true;
  }
  handleClick(e: MouseEvent, { page }: EventContext): boolean | void {
    const dropdown = page.getPlugin("dropdown").instance as Dropdown;
    if (dropdown.isOpen) {
      dropdown.close();
      this.clearStatus();
    }
  }
  handleArrowKeyDown(e: KeyboardEvent, { page }: EventContext): boolean | void {
    const dropdown = page.getPlugin("dropdown").instance as Dropdown;
    if (!dropdown.isOpen) {
      return;
    }
    if (e.key === "ArrowUp") {
      dropdown.hoverPrev();
    } else if (e.key === "ArrowDown") {
      dropdown.hoverNext();
    } else {
      return;
    }
    return true;
  }

  handleBeforeInput(e: TypedInputEvent, context: EventContext): boolean | void {
    const { page, range, block } = context;
    const dropdown = page.getPlugin("dropdown").instance as Dropdown;

    if (!range) {
      throw new NoRangeError();
    }
    // 弹出条件：首次输入 /
    if (e.inputType === "insertText" && e.data === "/" && !dropdown.isOpen) {
      this.status.startBias = locationToBias(
        block.root,
        range.startContainer as ValidNode,
        range.startOffset
      );
      this.status.endBias = this.status.endBias + 1;
      // 超出没有结果 5 个字符就取消
      dropdown.make(context);
    }
    // 筛选条件：弹出条件（包括首次）下键入或删除
    if (dropdown.isOpen) {
      if (e.inputType === "insertText") {
        this.status.data += e.data;
        this.status.endBias += 1;
      } else if (e.inputType === "deleteContentBackward") {
        this.status.data = this.status.data.slice(0, -1);
        this.status.endBias -= 1;

        if (this.status.data.length === 0) {
          console.log("close", this.status.data);
          dropdown.close();
        }
      }
      dropdown.update(this.status.data.slice(1));
    }
    // console.log(e.inputType);
  }
}
