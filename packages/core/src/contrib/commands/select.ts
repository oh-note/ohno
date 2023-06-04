import { Command } from "@ohno-editor/core/system/history";

export class Empty<T> extends Command<T> {
  execute(): void {}
  undo(): void {}
}
