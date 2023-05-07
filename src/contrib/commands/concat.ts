import { Command } from "@/system/history";

export type LazyCommand<T> = (
  payload: T,
  middle: { [key: string]: any },
  status: Status
) => Command<any> | void | null;

class Status {
  prevented: boolean = false;
  skiped: boolean = false;
  skip() {
    this.skiped = true;
  }
  prevent() {
    this.prevented = true;
  }
}

class ListCommand<T> extends Command<T> {
  lazy: LazyCommand<T>[] = [];
  commands?: Command<any>[];
  constructor(payload: T, lazy: LazyCommand<T>[] = []) {
    super(payload);
    this.lazy = lazy;
  }

  execute(): void {
    const extra = {};
    if (this.commands) {
      this.commands.forEach((item) => {
        item.execute();
        if (item.onExecuteFn) {
          item.onExecuteFn(item.payload, item.buffer);
        }
      });
      return;
    }
    this.commands = [];
    const status = new Status();
    for (const cfn of this.lazy) {
      const command = cfn(this.payload, extra, status);
      if (status.skiped || !command) {
        status.skiped = false;
        continue;
      }
      command.history = this.history;
      command.execute();
      if (command.onExecuteFn) {
        command.onExecuteFn(command.payload, command.buffer);
      }
      if (status.prevented) {
        break;
      }
      this.commands.push(command);
    }
  }

  public undo(): void {
    for (let index = this.commands!.length - 1; index >= 0; index--) {
      const command = this.commands![index];
      command.undo();
      if (command.onUndoFn) {
        command.onUndoFn(command.payload, command.buffer);
      }
    }
  }
}

export class ListCommandBuilder<T> {
  payload: T;
  commands: LazyCommand<T>[] = [];
  constructor(payload: T) {
    this.payload = payload;
  }
  withLazyCommand(lazy: LazyCommand<T>) {
    this.commands.push(lazy);
    return this;
  }
  withCommand(command: Command<any>) {
    this.commands.push(() => command);
    return this;
  }
  build() {
    return new ListCommand(this.payload, this.commands);
  }
}
