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
  component: {
    options: HTMLElement;
    noresult: HTMLElement;
  };
  hover: number = -1;
  visibleElements: HTMLElement[];
  constructor() {
    this.root = createElement("div", {
      className: CLASS_PLUGIN,
      textContent: "",
    });
    this.options = [];
    this.visibleElements = [];

    const options = createElement("div", {
      style: { display: "none" },
      className: "options",
    });
    const noresult = createElement("div", {
      style: { display: "none" },
      className: "noresult",
      textContent: "noresult",
    });

    this.component = {
      options,
      noresult,
    };
    this.root.appendChild(options);
    this.root.appendChild(noresult);
    options.addEventListener("mousemove", this.handleMouseMove.bind(this));
    options.addEventListener("click", this.handleClick.bind(this));
  }

  setFilter(filter: string | undefined, context: RangedEventContext) {
    this.filter = filter;
    const index = this.hover;
    this.hover = -1;
    this.renderMenu();
    this.onHover(index);
    this.context = context;
  }

  toggleComponent(el: HTMLElement) {
    this.root.childNodes.forEach((item) => {
      if (item === el) {
        (item as HTMLElement).style.display = "block";
      } else {
        (item as HTMLElement).style.display = "none";
      }
    });
  }

  addOption(option: MenuItem) {
    if (!option.dynamic && !option.static) {
      throw new Error("one of dynamic or static should be assigned.");
    }
    this.options.push(option);
  }

  renderMenu() {
    const { range } = this.context!;
    // debugger;
    computePosition(new RangeElement(range), this.root, {
      placement: "bottom-start",
    }).then(({ x, y }) => {
      Object.assign(this.root.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    const createContext: SlashMenuCreatedContext = {
      page: this.context!.page,
      plugin: this,
    };

    const visibleElements: HTMLElement[] = [];
    const elements = this.options
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
        if (row.style.display != "none") {
          visibleElements.push(row);
        }

        return row;
      })
      .map((item, index) => this.makeMenuItem(item, index));
    this.visibleElements = visibleElements;
    if (visibleElements.length > 0) {
      this.component.options.replaceChildren(...elements);
      this.toggleComponent(this.component.options);
    } else {
      this.toggleComponent(this.component.noresult);
    }
  }
  private makeMenuItem(inner: HTMLElement, index: number) {
    inner.setAttribute("index", index + "");
    return inner;
  }

  public get isOpen(): boolean {
    return this.root.style.display !== "none";
  }

  open(context: RangedEventContext) {
    this.context = context;
    this.filter = undefined;
    this.root.style.display = "block";
    this.hover = -1;
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
    return this.visibleElements[index] as HTMLElement;
  }

  simulateArrowDown() {
    const index = (this.hover + 1) % this.visibleElements.length;
    this.onHover(index);
  }
  simulateArrowUp() {
    let index;
    if (this.hover === 0) {
      index = this.visibleElements.length - 1;
    } else {
      index = this.hover - 1;
    }
    this.onHover(index);
  }
  simulateEnter() {
    // if(this.)
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
      if (option) {
        option.classList.add("hover");
        const onHover = this.options[index].onHover;
        if (onHover) {
          onHover(this.context!, {
            menuitem: option,
            page: this.context!.page,
            plugin: this,
          });
        }
      } else {
        this.hover = this.visibleElements.length - 1;
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
