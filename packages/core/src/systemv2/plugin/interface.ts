import { Page } from "../types";

export interface IPlugin {
  name: string;
  root: HTMLElement;
  parent?: Page;
  destory(): void;
  setParent(parent?: Page): void;
}
