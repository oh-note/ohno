import { LinkedList } from "@struct/linkedlist";
import { AnyBlock, Block } from "./block";
import { Page } from "./page";

export interface Payload {
  page: Page;
  block: AnyBlock;
  undo_hint?: { [key: string]: any };
  intime?: { [key: string]: any };
}

export interface ContainerPayload extends Payload {
  container: HTMLElement;
}

export type CommandCallback<P> = (payload: P) => void;

export abstract class Command<P> {
  payload: P;
  history?: History;

  afterUndo?: CommandCallback<P>;
  afterExecute?: CommandCallback<P>;

  constructor(
    payload: P,
    exeCallback?: CommandCallback<P>,
    undoCallback?: CommandCallback<P>
  ) {
    this.payload = payload;
    this.execute = this.ensureContext(this.execute.bind(this));
    this.afterExecute = exeCallback;
    this.afterUndo = undoCallback;
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
  tryMerge(command: Command<any>) {
    return false;
  }

  public withExecuteCallback(afterExecute: CommandCallback<P>) {
    this.afterExecute = afterExecute;
    return this;
  }
  public withUndoCallback(afterUndo: CommandCallback<P>) {
    this.afterUndo = afterUndo;
    return this;
  }
  public get label(): string {
    return "";
  }
}

export class History {
  commands: LinkedList<Command<any>> = new LinkedList();

  undo_commands: LinkedList<Command<any>> = new LinkedList();

  status: string = "";

  max_history: number;
  constructor(max_history: number = 200) {
    this.max_history = max_history;
  }

  append(command: Command<any>) {
    if (this.commands.last) {
      if (!this.commands.last.value.tryMerge(command)) {
        this.commands.append(command);
      }
    } else {
      this.commands.append(command);
    }
  }

  execute(command: Command<any>) {
    console.log(command);
    command.history = this;
    command.execute();
    if (command.afterExecute) {
      command.afterExecute(command.payload);
    }
    this.undo_commands.clear();
    this.append(command);
  }

  undo() {
    const results = this.commands.popLast();
    // console.log(results);
    if (results) {
      results[0].undo();
      if (results[0].afterUndo) {
        results[0].afterUndo(results[0].payload);
      }
      this.undo_commands.append(results[0]);
    }
  }

  redo() {
    const results = this.undo_commands.popLast();
    // console.log(results);
    if (results) {
      results[0].execute();
      console.log("redo");
      if (results[0].afterExecute) {
        console.log("redo callback");
        results[0].afterExecute(results[0].payload);
      }
      this.commands.append(results[0]);
    }
  }
}

export const globalHistory = new History();
