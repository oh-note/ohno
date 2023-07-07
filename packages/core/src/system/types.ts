import { AnyBlock } from "./block";

export {
  Page,
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  PageRedoEvent,
  PageUndoEvent,
  PageHandler,
  type BlockComponent,
  type InlineComponent,
  type PluginComponent,
  type ComponentEntryFn,
  type Component,
  type PageCommandInit,
  type HandlerEntry,
  type HandlerFlag,
} from "./page";

export type {
  ControlKeyEventHandleMethods,
  PageEventContext,
  BlockEventContext,
  InlineHandler,
  InlineEventContext,
  MultiBlockEventContext,
  RangedBlockEventContext,
  InlineRangedEventContext,
  ClipboardEventHandleMethods,
  MouseEventHandleMethods,
  HandlerMethod,
  HandlerMethods,
  PagesHandleMethods,
  WindowEventHandleMethods,
  InlineHandleMethods,
  KeyboardEventHandleMethods,
  UIEventHandleMethods,
  BlockEventHandleMethods,
  FocusEventHandleMethods,
  InputEventHandleMethods,
  InlineEventHandleMethods,
} from "./handler";

export type {
  AnyBlock,
  BlockSerializedData,
  BlockSerializer,
  IBlock,
  CommandSet,
  EditableExtra,
  InnerHTMLExtra,
  BackspacePayLoad,
  DeletePayLoad,
  CommonPayLoad,
  SplitExtra,
} from "./block";
export { Block, BaseBlockSerializer } from "./block";

export {
  InlineSerializer,
  InlineBase,
  InlineSupport,
  LabelSerializer,
} from "./inline";
export type {
  IInline,
  InlineData,
  LabelData,
  InlineSerializedData,
} from "./inline";

export type { IPlugin } from "./plugin";

export {
  History,
  Command,
  ListCommandBuilder,
  type AnyCommand,
  type CommandBuffer,
  type CommandCallback,
  type CommandCallbackWithBuffer,
} from "./command";

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

export { RangeElement, MouseElement } from "./floating";
export { type OhNoClipboardData } from "./clipboard";

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

export type HTMLElementTagName = keyof HTMLElementTagNameMap;
export type ElementTagName = keyof HTMLElementTagNameMap | "#text";
export type HTMLElementType = HTMLElementTagNameMap[HTMLElementTagName];
export type EventAttribute = {
  [key in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[key]) => void;
};

export type ChildrenData = string | Node | (string | Node)[];
export type BlockData = Dict;
export type ValidNode = Text | HTMLElement | Element;

export type FormatOp = "addFormat" | "removeFormat";

export type Dict = { [key: string]: any };
