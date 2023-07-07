import { Command } from "@ohno-editor/core/system/types";

export class Empty<T> extends Command<T> {
  execute(): void {}
  undo(): void {}
  withExecute(fn: () => void) {
    this.execute = fn;
    return this;
  }
  withUndo(fn: () => void) {
    this.undo = fn;
    return this;
  }
}

export class None extends Command<object> {
  execute(): void {}
  undo(): void {}
}
