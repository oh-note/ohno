// 指令系统的接口 + 历史记录
import { LinkedList } from "@/struct/linkedlist";
import { AnyBlock, Block } from "./block";
import { Page } from "./page";

export interface Payload {
  page: Page;
  block: AnyBlock;
  // undo_hint?: { [key: string]: any };
  intime?: { [key: string]: any };
}

export interface ContainerPayload extends Payload {
  container: HTMLElement;
}

export interface CommandBuffer {
  [key: string]: any;
}
export interface CommandIntime {
  [key: string]: any;
}

export type CommandCallback<P> = (payload: P, buffer: any) => void;
export type CommandCallbackWithBuffer<P, B> = (payload: P, buffer: B) => void;

export abstract class Command<P> {
  payload: P;
  history?: History;
  // createdFromIntime: boolean = false;
  // intime: CommandIntime = {};
  // 存储 execute 过程中产生的值，用于设置执行后的光标或 undo
  // 对于 offset 类的 buffer 可以减少重复计算；
  // 对于 node 类的 reference 类的 buffer 每次必须重新设置
  // TODO 逐步废弃 payload 中的 undo_hint，替换成使用 buffer
  // buffer 会在 callback 中作为第二个参数传递
  buffer: CommandBuffer = {};
  onUndoFn?: CommandCallback<P>;
  onExecuteFn?: CommandCallback<P>;

  constructor(
    payload: P,
    exeCallback?: CommandCallback<P>,
    undoCallback?: CommandCallback<P>
  ) {
    this.payload = payload;
    this.execute = this.ensureContext(this.execute.bind(this));
    this.onExecuteFn = exeCallback;
    this.onUndoFn = undoCallback;
  }

  protected ensureContext(fn: () => any) {
    const that = this;
    return function () {
      if (that.history) {
        fn();
      } else {
        throw new Error("Command should be emitted into history context");
      }
    };
  }

  abstract execute(): void;
  abstract undo(): void;

  removeCallback() {
    return this.onExecute().onUndo();
  }

  tryMerge(command: Command<any>) {
    return false;
  }

  public onExecute(onExecuteFn?: CommandCallback<P>) {
    this.onExecuteFn = onExecuteFn;
    return this;
  }
  public onUndo(onUndoFn?: CommandCallback<P>) {
    this.onUndoFn = onUndoFn;
    return this;
  }
  public get label(): string {
    return "";
  }
}

export class History {
  commands: LinkedList<Command<any>> = new LinkedList();
  undo_commands: LinkedList<Command<any>> = new LinkedList();

  max_history: number;
  constructor(max_history: number = 200) {
    this.max_history = max_history;
  }

  append(command: Command<any>) {
    console.log("append", command);
    if (this.commands.last) {
      if (!this.commands.last.value.tryMerge(command)) {
        command.history = this;
        this.commands.append(command);
      }
    } else {
      command.history = this;
      this.commands.append(command);
    }
  }

  execute(command: Command<any>) {
    console.log(command);
    command.history = this;
    command.execute();
    if (command.onExecuteFn) {
      command.onExecuteFn(command.payload, command.buffer);
    }
    this.undo_commands.clear();
    this.append(command);
  }

  undo(): boolean {
    const results = this.commands.popLast();
    console.log(results);
    if (results) {
      const command = results[0];
      command.undo();
      if (command.onUndoFn) {
        command.onUndoFn(command.payload, command.buffer);
      }
      this.undo_commands.append(command);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const results = this.undo_commands.popLast();
    if (results) {
      const command = results[0];
      command.execute();
      console.log("redo");
      if (command.onExecuteFn) {
        console.log("redo callback");
        command.onExecuteFn(command.payload, command.buffer);
      }
      this.commands.append(command);
      return true;
    }
    return false;
  }
}

export const globalHistory = new History();
