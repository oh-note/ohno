export enum DomEvents {
  blockCopy = "block-copy",
  inlineCopy = "inline-copy",
  keydown = "keydpwm",
  keyup = "keyup",
  keypressArray = "keypressArray",
  keypressArrowUp = "keypressUp",
  keypressArrowDown = "keypressDown",
  keypressArrowLeft = "keypressLeft",
  keypressArrowRight = "keypressRight",
}

export type BlockTypeNames =
  // 1
  | "heading"
  | "paragraph"
  | "quote"
  // n
  | "list"
  | "ordered-list"
  // mxn
  | "table"
  // others
  | "image"
  | "code"
  | "card"
  | "equation";

export type PageOperationNames =
  | "remove"
  | "append"
  | "append-paragraph"
  | "append-list"
  | "append-orderedlist"
  | "remove"
  | "move"
  | "insert"
  | "delete"
  | "replace";

export interface PageOperationInit {}

export class PageOperation {
  type: PageOperationNames;
  constructor(type: PageOperationNames, eventInitDict?: PageOperationInit) {
    this.type = type;
    Object.assign(this, eventInitDict);
  }
}

export interface AppendInit extends PageOperationInit {}
export class Append extends PageOperation {
  constructor(eventInitDict?: AppendInit) {
    super("append", eventInitDict);
  }
}

// declare var PageEvent{

// }
