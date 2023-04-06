import { LinkedList } from "../struct/linkedlist";
import { Block } from "./block";
import { Page } from "./page";

export abstract class Command<P> {
  payload: P;
  history?: History;
  constructor(payload: P) {
    this.payload = payload;
    this.execute = this.ensureContext(this.execute.bind(this));
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
    command.history = this;
    command.execute();
    this.append(command);
  }

  undo() {
    const results = this.commands.popLast();
    // console.log(results);
    if (results) {
      results[0].undo();
      this.undo_commands.append(results[0]);
    }
  }

  redo() {
    const results = this.undo_commands.popLast();
    // console.log(results);
    if (results) {
      results[0].execute();
      this.commands.append(results[0]);
    }
  }
}

export const globalHistory = new History();
