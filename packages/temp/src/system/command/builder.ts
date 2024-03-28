import { Page, Command, Dict } from "../types";

export type LazyCommandFn<T, K> = (
  payload: T,
  middle: K,
  _: any
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

class ListCommand<T, K = Dict> extends Command<T> {
  lazy: [LazyCommandFn<T, K>, any][] = [];
  commands?: Command<any>[];
  constructor(payload: T, lazy: [LazyCommandFn<T, K>, any][] = []) {
    super(payload);
    this.lazy = lazy;
  }

  execute(): void {
    const extra = {} as K;
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
    for (const [cfn, payload] of this.lazy) {
      const command = cfn(payload || this.payload, extra, status);
      if (status.skiped || !command) {
        status.skiped = false;
        continue;
      }
      command.history = this.history;
      // eslint-disable-next-line no-useless-catch
      try {
        command.execute();
      } catch (error) {
        console.error(`Error when execute ${command}`);
        throw error;
      }
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
  notifyExecute(page: Page): void {
    this.commands!.forEach((item) => {
      item.notifyExecute(page);
    });
  }
  notifyUndo(page: Page): void {
    this.commands!.forEach((item) => {
      item.notifyUndo(page);
    });
  }
  notifyRedo(page: Page): void {
    this.commands!.forEach((item) => {
      item.notifyRedo(page);
    });
  }
}

export class ListCommandBuilder<T, K = any> {
  payload: T;
  commands: [LazyCommandFn<T, K>, any][] = [];
  constructor(payload: T) {
    this.payload = payload;
  }

  addLazyCommand<E = any>(lazy: LazyCommandFn<T, K>, payload?: E) {
    this.commands.push([lazy, payload]);
    return this;
  }

  addLazyCommandWithPayLoad<E>(lazy: LazyCommandFn<E, K>, payload: E) {
    this.commands.push([lazy as unknown as LazyCommandFn<T, K>, payload]);
    return this;
  }

  addCommand(command: Command<any>) {
    this.commands.push([() => command, null]);
    return this;
  }

  build() {
    return new ListCommand(this.payload, this.commands);
  }
}
