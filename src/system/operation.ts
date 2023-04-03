/**
 * 事件类型：
 *
 * dom event:
 *  - key event
 *  - mouse event
 *  - input/copy/paste event
 *  - other event
 *
 * editor event:
 *  - key enter -> new block event (by page/block)
 *  - key backspace/delete -> delete/merge block event (by block-extra-handler)
 *  - key backspace/space -> change block event (by block-extra-handler)
 *  - key enter/backspace -> inner edit event (list/orderedlist, by block)
 *  - key arrow -> move cursor event (by page/block)
 *  - drag/drop event -> move block event (by page)
 *  - click event -> delete block event (by page)
 *  - click event -> format event (by general)
 *
 * global handler:
 *
 *  - beforeHandler[blockType].handleX(e)
 *  - pageHandler.handleX(e)
 *  - afterHandler[blockType].handleX(e)
 *
 * operation Handler:
 *  - handleOperation(name)
 *  -
 */

import { Page } from "./page";

export interface Operation {
  type: string;
  payload: any;
}

export interface OperationContext {
  page?: Page;
  eventType?: string;
  event?: UIEvent;
  src?: any; // block
}

export interface OperationHandlerFn {
  (payload: Operation, context: OperationContext): void;
}
