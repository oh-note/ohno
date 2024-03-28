import { AnyBlock, Command, Page } from "@ohno/core/system/types";
export interface LinkHrefPayload {
  page: Page;
  block: AnyBlock;
  link: HTMLLinkElement;
  href: string;
}
export class SetLinkHref extends Command<LinkHrefPayload> {
  declare buffer: {
    globalBias: [number, number];
    href: string;
  };
  constructor(payload: LinkHrefPayload) {
    super(payload);
    const { block, link } = payload;
    const bias = block.getGlobalBiasPair([link, 0]);
    this.buffer = {
      globalBias: bias,
      href: link.href,
    };
  }
  execute(): void {
    const { globalBias } = this.buffer;
    const { block, href } = this.payload;
    let [node, offset] = block.getLocation(...globalBias)!;
    if (node instanceof Text) {
      node = node.parentElement as HTMLLinkElement;
    }
    const link = node as HTMLLinkElement;
    link.href = href;
  }
  undo(): void {
    const { globalBias, href } = this.buffer;
    const { block } = this.payload;
    let [node, offset] = block.getLocation(...globalBias)!;
    if (node instanceof Text) {
      node = node.parentElement as HTMLLinkElement;
    }
    const link = node as HTMLLinkElement;
    link.href = href;
  }
  tryMerge(command: Command<any>): boolean {
    if (command instanceof SetLinkHref) {
      if (this.payload.link === command.payload.link) {
        return true;
      }
    }
    return false;
  }
}
