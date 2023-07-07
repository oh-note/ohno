import { BlockEventContext, Page } from "../types";
import { InlineSupport } from "./plugin";

export interface IInline {
  name: string;
  parent?: Page;
  root: HTMLElement;
  plugin: InlineSupport;
  setInlineManager(plugin: InlineSupport): void;
  destory(): void;
  create(payload: any): HTMLLabelElement;
  hover(label: HTMLLabelElement, context: BlockEventContext): void;
  activate(label: HTMLLabelElement, context: BlockEventContext): void;
  exit(onExit?: () => void): void;
}
