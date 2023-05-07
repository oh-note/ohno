import { TextDelete } from "@/contrib/commands";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { createElement } from "@/helper/document";
import { parentElementWithFilter } from "@/helper/element";
import { IComponent, IContainer, IPlugin } from "@/system/base";
import { AnyBlock } from "@/system/block";
import { EventContext, RangedEventContext } from "@/system/handler";
import { Command } from "@/system/history";
import { Page } from "@/system/page";
import { computePosition } from "@floating-ui/dom";
import "./style.css";
import { RangeElement } from "@/system/inline";

const CLASS_OPTION = "oh-is-option";
const CLASS_PLUGIN = "oh-is-slashmenu";

// 大图
export interface SlashMenuPluginContext {
  menuitem: HTMLElement;
  plugin: SlashMenu;
  page: Page;
}

export interface SlashMenuCreatedContext {
  plugin: SlashMenu;
  page: Page;
}

export interface MenuInfo {
  icon?: string;
  name: string;
  description?: string;
}

export interface MenuItem {
  dynamic?: (dropdown: SlashMenuCreatedContext) => MenuInfo;
  static?: MenuInfo;

  filter:
    | string
    | ((text: string, context: SlashMenuCreatedContext) => boolean);

  onHover?: (
    context: RangedEventContext,
    pcontext: SlashMenuPluginContext
  ) => void;
  onSelect?: (
    context: RangedEventContext,
    pcontext: SlashMenuPluginContext
  ) => Command<any>;
}

export class SlashMenu implements IPlugin {
  root: HTMLElement;
  name: string = "slashmenu";
  options: MenuItem[];
  parent?: IComponent | undefined;
  context?: RangedEventContext;
  filter?: string;

  hover: number = -1;

  constructor() {
    this.root = createElement("div", {
      className: CLASS_PLUGIN,
      textContent: "",
    });
    this.options = [];
    this.root.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.root.addEventListener("click", this.handleClick.bind(this));
  }

  setFilter(filter: string | undefined, context: RangedEventContext) {
    this.filter = filter;
    const index = this.hover;
    this.hover = -1;
    this.renderMenu();
    this.onHover(index);
    this.context = context;
  }

  addOption(option: MenuItem) {
    if (!option.dynamic && !option.static) {
      throw new Error("one of dynamic or static should be assigned.");
    }
    this.options.push(option);
  }

  renderMenu() {
    const { range } = this.context!;

    computePosition(new RangeElement(range), this.root, {
      placement: "bottom-start",
    }).then(({ x, y }) => {
      Object.assign(this.root.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    let filtered = this.options;
    console.log(filtered);
    const createContext: SlashMenuCreatedContext = {
      page: this.context!.page,
      plugin: this,
    };

    const elements = filtered
      .map((item) => {
        const row = createElement("div", { className: CLASS_OPTION });
        const info = item.dynamic ? item.dynamic(createContext) : item.static!;
        if (info.description) {
          // 大的
          row.appendChild(
            createElement("div", {
              textContent: info.description,
              className: "description",
            })
          );
          row.appendChild(
            createElement("div", { textContent: info.name, className: "name" })
          );
          row.classList.add("medium");
        } else {
          row.appendChild(
            createElement("div", { textContent: info.name, className: "name" })
          );
          row.classList.add("small");
        }

        if (this.filter) {
          if (typeof item.filter === "string") {
            if (item.filter.indexOf(this.filter!) < 0) {
              row.style.display = "none";
            }
          } else if (!item.filter(this.filter!, createContext)) {
            row.style.display = "none";
          }
        }
        return row;
      })
      .map((item, index) => this.makeMenuItem(item, index));
    this.root.replaceChildren(...elements);
  }
  private makeMenuItem(inner: HTMLElement, index: number) {
    inner.setAttribute("index", index + "");
    return inner;
  }

  // mouseClick(e: MouseEvent) {}
  // simulateArrowDown() {}
  // simulateArrowUp() {}

  public get isOpen(): boolean {
    return this.root.style.display !== "none";
  }

  open(context: RangedEventContext) {
    this.context = context;
    this.filter = undefined;
    this.root.style.display = "block";
    this.renderMenu();
    this.onHover(0);
  }

  close() {
    this.root.style.display = "none";
    this.filter = undefined;
    this.context = undefined;
    this.hover = -1;
  }

  setParent(parent?: IContainer | undefined): void {
    this.parent = parent;
  }

  findOption(node: Node): HTMLElement | null {
    const option = parentElementWithFilter(node, this.root, (el: Node) => {
      return el instanceof HTMLElement && el.classList.contains(CLASS_OPTION);
    });
    return option;
  }

  getOption(index: number): HTMLElement {
    return this.root.childNodes[index] as HTMLElement;
  }

  simulateArrowDown() {
    const index = (this.hover + 1) % this.root.childNodes.length;
    this.onHover(index);
  }
  simulateArrowUp() {
    let index;
    if (this.hover === 0) {
      index = this.root.childNodes.length - 1;
    } else {
      index = this.hover - 1;
    }
    this.onHover(index);
  }
  simulateEnter() {
    this.onSelected(this.hover);
  }

  onHover(index: number) {
    if (index !== this.hover) {
      if (this.hover >= 0) {
        const oldoption = this.getOption(this.hover);
        oldoption.classList.remove("hover");
      }

      this.hover = index;
      const option = this.getOption(index);
      option.classList.add("hover");
      const onHover = this.options[index].onHover;
      if (onHover) {
        onHover(this.context!, {
          menuitem: option,
          page: this.context!.page,
          plugin: this,
        });
      }
    }
  }
  onSelected(index: number) {
    const option = this.getOption(index);
    const onSelect = this.options[index].onSelect;
    if (onSelect) {
      const one = onSelect(this.context!, {
        menuitem: option,
        page: this.context!.page,
        plugin: this,
      });
      const { page, block, range } = this.context!;
      const command = new ListCommandBuilder({})
        .withLazyCommand(() => {
          const text = range.startContainer.textContent!;
          const bias = block.getBias([range.startContainer, range.startOffset]);

          const start = text.lastIndexOf("/", range.startOffset);
          const index = block.findEditableIndex(range.startContainer);
          const token_number = start - range.startOffset;
          return new TextDelete({
            page,
            block,
            start: bias,
            index,
            token_number,
          }).onExecute(() => {
            page.focusEditable();
          });
        })
        .withCommand(one)
        .build();
      page.executeCommand(command);

      this.close();
    }
  }

  handleMouseMove(e: MouseEvent) {
    const option = this.findOption(e.target as Node);
    if (option) {
      const index = parseInt(option.getAttribute("index")!);
      this.onHover(index);
    }
  }

  handleClick(e: MouseEvent) {
    const option = this.findOption(e.target as Node);
    if (option) {
      const index = parseInt(option.getAttribute("index")!);
      this.onSelected(index);
    }
  }

  serialize(option?: any): string {
    throw new Error("Method not implemented.");
  }

  equals(component?: IComponent | undefined): boolean {
    throw new Error("Method not implemented.");
  }

  detach(): void {
    throw new Error("Method not implemented.");
  }

  hook(): void {
    throw new Error("Method not implemented.");
  }

  destory(): void {
    throw new Error("Method not implemented.");
  }
}
