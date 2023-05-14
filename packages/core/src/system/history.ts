// Instruction system interface + history record
import { LinkedList } from "@ohno-editor/core/struct/linkedlist";
import { AnyBlock } from "./block";
import { Page } from "./page";

/**
 * Payload interface represents the data associated with a command.
 */
export interface Payload {
  page: Page; // The page associated with the command.
  block: AnyBlock; // The block associated with the command.
  intime?: { [key: string]: any }; // Optional additional data associated with the command.
}

/**
 * ContainerPayload interface represents the data associated with a command that involves a container element.
 */
export interface ContainerPayload extends Payload {
  container: HTMLElement; // The container element associated with the command.
}

/**
 * CommandBuffer interface represents a buffer object that stores values generated during command execution.
 */
export interface CommandBuffer {
  [key: string]: any;
}

/**
 * CommandIntime interface represents additional data associated with a command.
 */
export interface CommandIntime {
  [key: string]: any;
}

/**
 * CommandCallback type represents a function that can be registered as a callback for a command.
 * It takes the payload and buffer as arguments.
 */
export type CommandCallback<P> = (payload: P, buffer: any) => void;

/**
 * CommandCallbackWithBuffer type represents a function that can be registered as a callback for a command.
 * It takes the payload and buffer as arguments.
 */
export type CommandCallbackWithBuffer<P, B> = (payload: P, buffer: B) => void;

/**
 * Abstract class representing a command.
 * A command represents an action that can be executed and undone.
 * It contains the payload data, execution logic, undo logic, and optional callbacks.
 */
export abstract class Command<P> {
  payload: P; // The payload data associated with the command.
  history?: History; // The history instance associated with the command.
  buffer: CommandBuffer = {}; // The buffer object to store values generated during command execution.
  onUndoFn?: CommandCallback<P>; // Optional callback function to be executed when the command is undone.
  onExecuteFn?: CommandCallback<P>; // Optional callback function to be executed when the command is executed.

  /**
   * Creates an instance of Command.
   * @param payload The payload data associated with the command.
   * @param exeCallback Optional callback function to be executed when the command is executed.
   * @param undoCallback Optional callback function to be executed when the command is undone.
   */
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

  /**
   * Ensures that the command is executed within a history context.
   * Throws an error if the command is not associated with a history instance.
   * @param fn The function to be executed within the history context.
   * @returns A function that checks the history context and executes the given function.
   */
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

  /**
   * Abstract method representing the execution logic of the command.
   */
  abstract execute(): void;

  /**
   * Abstract method representing the undo logic of the command.
   */
  abstract undo(): void;

  /**
   * Method to notify the page that the command
was executed.
   * @param page The page instance to notify.
   */
  notifyExecute(page: Page): void {}

  /**
   * Method to notify the page that the command was undone.
   * @param page The page instance to notify.
   */
  notifyUndo(page: Page): void {}

  /**
   * Method to notify the page that the command was redone.
   * @param page The page instance to notify.
   */
  notifyRedo(page: Page): void {
    this.notifyExecute(page);
  }

  /**
   * Removes the registered callbacks for the command.
   * @returns The command instance for method chaining.
   */
  removeCallback() {
    return this.onExecute().onUndo();
  }

  /**
   * Tries to merge the given command with the current command.
   * Subclasses can override this method to implement command merging logic.
   * @param command The command to be merged.
   * @returns True if the merge was successful, false otherwise.
   */
  tryMerge(command: Command<any>) {
    return false;
  }

  /**
   * Registers a callback function to be executed when the command is executed.
   * @param onExecuteFn The callback function to be executed.
   * @returns The command instance for method chaining.
   */
  public onExecute(onExecuteFn?: CommandCallback<P>) {
    this.onExecuteFn = onExecuteFn;
    return this;
  }

  /**
   * Registers a callback function to be executed when the command is undone.
   * @param onUndoFn The callback function to be executed.
   * @returns The command instance for method chaining.
   */
  public onUndo(onUndoFn?: CommandCallback<P>) {
    this.onUndoFn = onUndoFn;
    return this;
  }

  /**
   * Returns the label associated with the command.
   * Subclasses can override this property to provide a label for the command.
   * @returns The label associated with the command.
   */
  public get label(): string {
    return "";
  }
}

/**
 * HistoryInit interface represents the initialization options for the History class.
 */
export interface HistoryInit {
  max_history: number; // The maximum number of commands to be stored in the history.
}

/**
 * History class represents a command history.
 * It stores the executed commands and provides methods for undoing and redoing commands.
 */
export class History {
  commands: LinkedList<Command<any>> = new LinkedList(); // The list of executed commands.
  undo_commands: LinkedList<Command<any>> = new LinkedList(); // The list of undone commands.

  max_history: number; // The maximum number of commands to be stored in the history.
  page: Page; // The page associated with the history.

  /**
   * Creates an instance of History.
   * @param page The page associated with the history.
   * @param init The initialization options for the history.
   */
  constructor(page: Page, init: HistoryInit) {
    this.max_history = init.max_history || 200;
    this.page = page;
  }

  /**
   * Appends a command to the history.
   * If the previous command can't be merged with the new command, the new command is added to the history.
   * @param command The command to be appended.
   */
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

  /**
   * Executes a command and adds it to the history.
   * * Executes a command and adds it to the history.
   * @param command The command to be executed.
   * @param executed Indicates whether the command has already been executed (optional).
   */
  execute(command: Command<any>, executed?: boolean) {
    console.log(command);
    command.history = this;
    if (!executed) {
      command.execute();
      if (command.onExecuteFn) {
        command.onExecuteFn(command.payload, command.buffer);
      }
    }
    command.notifyExecute(this.page);
    this.undo_commands.clear();
    this.append(command);
  }

  /**
   * Undoes the last executed command in the history.
   * @returns True if a command was undone, false otherwise.
   */
  undo(): boolean {
    const results = this.commands.popLast();
    console.log(results);
    if (results) {
      const command = results[0];
      command.undo();
      if (command.onUndoFn) {
        command.onUndoFn(command.payload, command.buffer);
      }
      command.notifyUndo(this.page);
      this.undo_commands.append(command);
      return true;
    }
    return false;
  }

  /**
   * Redoes the last undone command in the history.
   * @returns True if a command was redone, false otherwise.
   */
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
      command.notifyRedo(this.page);
      this.commands.append(command);
      return true;
    }
    return false;
  }
}
