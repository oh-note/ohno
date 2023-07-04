import { AnyBlock } from "./block";

export { Page } from "./page";
/** Page Event */
export {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  PageRedoEvent,
  PageUndoEvent,
} from "./page";

export * from "./handler";

export type {
  AnyBlock,
  BlockSerializedData,
  BlockSerializer,
  BlockData,
  IBlock,
} from "./block";
export { Block } from "./block";

export { InlineBase } from "./inline";
export type { IInline, InlineData } from "./inline";

export type { IPlugin } from "./plugin";

export { Command, History } from "./command";

export {
  RichSelection,
  PlainSelection,
  type SelectionMethods,
} from "./selection";

export {
  ShortCutManager,
  type IShortcut,
  type ShorcutEntry,
  type Shortcut,
  type PlatformShortcut,
} from "./shortcut";

export type ElementFilter<T = Node> = (el: T) => boolean;

// 因为 range 本身不具备额外辨识 Editable、block 范围的属性
// 所以只在 handler 中根据具体功能封装，block 本身只提供 interval 到 range 的转换
// 在 HTMLElement 中定位范围
export interface Interval {
  start: number;
  end: number;
}

// 在 Block 中定位某个 Editable 的范围
export interface EditableInterval {
  start: number;
  end: number;
  index: number;
}

export type RefLocation = [Node, number];

export type WHERE = "afterbegin" | "afterend" | "beforebegin" | "beforeend";

export type Editable = HTMLElement;
export type Order = string;
export type BlockQuery = AnyBlock | Order;
export type EditableFlag = HTMLElement | number;
