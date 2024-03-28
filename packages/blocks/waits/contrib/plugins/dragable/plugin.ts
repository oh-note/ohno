import { createElement } from "../../../system/functional";
import {
  IPlugin,
  OhNoClipboardData,
  AnyBlock,
  Page,
} from "../../../system/types";
import { computePosition, autoUpdate } from "@floating-ui/dom";
import "./style.css";

export class Dragable implements IPlugin {
  root: HTMLElement;
  name: string = "dragable";
  parent!: Page;
  current?: AnyBlock;
  draged?: AnyBlock;

  cleanUp?: () => void;
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-dragable",
      textContent: "",
      style: { position: "absolute" },
    });
    this.root.draggable = true;
    this.root.addEventListener("dragstart", (event) => {
      console.log(event);
      if (event.dataTransfer && this.current) {
        const block = this.current;
        event.dataTransfer.setDragImage(this.current!.root, 0, 0);
        const text = block.toMarkdown();
        const html = block.toHTML();
        event.dataTransfer.setData("text/plain", text);
        event.dataTransfer.setData("text/html", html);
        const ser = this.parent.getBlockSerializer(block.type);

        const ohnoData: OhNoClipboardData = {
          data: [ser.toJson(block)],
          context: {
            dragFrom: this.current.order,
          },
        };
        this.draged = block;
        const json = JSON.stringify(ohnoData);
        event.dataTransfer.setData("text/ohno", json);
      }
    });
    this.root.addEventListener("dragend", (e) => {
      e.preventDefault();
    });

    // this.root.addEventListener("mouseup", (e) => {
    //   debugger;
    // });
  }
  hook(): void {
    throw new Error("Method not implemented.");
  }
  destory(): void {
    throw new Error("Method not implemented.");
  }
  setParent(parent?: Page): void {
    this.parent = parent!;
  }
  serialize(option?: any): string {
    throw new Error("Method not implemented.");
  }

  detach(): void {
    throw new Error("Method not implemented.");
  }
  // close() {
  //   this.root.style.display = "none";
  // }
  span(block: AnyBlock, force?: boolean) {
    this.root.style.height = block.root.clientHeight + "px";
    // this.root.style.display = "block";
    if (this.current !== block || force) {
      if (this.cleanUp) {
        this.cleanUp();
      }
      this.current = block;
      // computePosition(block.root, this.root, {
      //   placement: "left-start",
      //   middleware: [],
      // }).then(({ x, y }) => {
      //   Object.assign(this.root.style, {
      //     left: `${x - 8}px`,
      //     top: `${y}px`,
      //   });
      // });
      this.cleanUp = autoUpdate(
        block.root,
        this.root,
        () => {
          computePosition(block.root, this.root, {
            placement: "left-start",
            middleware: [],
          }).then(({ x, y }) => {
            Object.assign(this.root.style, {
              left: `${x - 8}px`,
              top: `${y}px`,
            });
          });
        },
        { ancestorScroll: true }
      );
    }
  }
}
