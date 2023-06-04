import { Command, CommandBuffer, Page } from "@ohno-editor/core/system";
import { ABCList } from "./block";

export interface DentPayload {
  page: Page;
  block: ABCList;
  indexs: number[];
  bias: number;
}
export class ListDentCommand extends Command<DentPayload> {
  declare buffer: {
    oldLevels: number[];
  };
  execute(): void {
    const { block, bias, indexs } = this.payload;

    const editables = indexs.map((item) => {
      return block.getEditable(item);
    });

    let bound = bias > 0 ? 0 : 10;
    const levels = editables.map((editable) => {
      const level = block.getIndentLevel(editable);
      if (bias > 0) {
        // indent
        bound = Math.max(bound, level);
      } else {
        // dedent
        bound = Math.min(bound, level);
      }
      return level;
    });
    if (bound + bias > 6 || bound + bias < 0) {
      return;
    }
    this.buffer = {
      oldLevels: levels,
    };

    editables.map((editable, index) => {
      const level = levels[index] + bias;
      editable.dataset["level"] = level + "";
      const types = block.listStyleTypes;
      Object.assign(editable.style, {
        marginLeft: `${level * 20}px`,
        listStyleType: types[level % types.length],
      });
      return level;
    });
    this.buffer;
    block.updateValue();
  }
  undo(): void {
    if (!this.buffer) {
      return;
    }

    const { block, indexs } = this.payload;
    const levels = this.buffer.oldLevels;
    const editables = indexs.map((item) => {
      return block.getEditable(item);
    });
    editables.map((editable, index) => {
      const level = levels[index];
      editable.dataset["level"] = level + "";
      const types = block.listStyleTypes;
      Object.assign(editable.style, {
        marginLeft: `${level * 20}px`,
        listStyleType: types[level % types.length],
      });
      return level;
    });

    block.updateValue();
  }
}
