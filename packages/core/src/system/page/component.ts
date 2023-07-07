import { AnyBlock, BlockSerializer, CommandSet } from "../types";
// import { BlockSerializer}
import { IInline, IPlugin } from "../types";

import { LabelSerializer } from "../inline";
import { HandlerEntry } from "./handler";
import { Page } from "./imp";

export interface Component {
  handlers?: HandlerEntry;
  onPageCreated?(page: Page): void;
}

export interface BlockComponent<T extends AnyBlock = AnyBlock>
  extends Component {
  name: string;
  blockType: new (data?: any) => T;
  isDefault?: boolean;
  serializer: BlockSerializer<T>;
  commandSet: CommandSet<T>;
  // Block Manager 负责创建、序列化、反序列化 Block
}

export interface PluginComponent extends Component {
  // 负责维护一个可选的 HTMLElement，并可以通过 handler 调用该 Manager 显示在必要位置上
  manager: IPlugin;
}

export interface InlineComponent extends Component {
  // 负责维护一个可选的 HTMLElement，用于在 inline 被激活时提供必要的操作
  name: string;
  manager: IInline;
  serializer?: LabelSerializer<any>;
}

export type ComponentEntryFn = (init: any) => Component;
