// Instruction system interface + history record
import { LinkedList } from "@ohno-editor/core/struct/linkedlist";

import { Page, AnyBlock } from "../types";
import { Command } from "./command_base";

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
