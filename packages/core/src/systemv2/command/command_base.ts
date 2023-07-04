// Instruction system interface + history record
import { Page } from "../types";
import { History } from "./history";
/**
 * CommandBuffer interface represents a buffer object that stores values generated during command execution.
 */
export interface CommandBuffer {
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
