import {
  createElement,
  createInline,
  addMarkdownHint,
} from "@ohno-editor/core/system/functional";
import { BlockEventContext, InlineBase } from "@ohno-editor/core/system/types";
import "./style.css";
import DONE from "./assest/done.svg";
import TODO from "./assest/todo.svg";
const FLAG = {
  TODO: TODO,
  DONE: DONE,
};

type FLAGKEY = keyof typeof FLAG;

export interface FlagPayload {
  first: FLAGKEY;
  constrain: FLAGKEY[];
  // content: string;
}

export interface FlagInit {
  // onLoad: (content: string) => Promise<TodoitemOption[]>;
  [key: string]: any;
}

const EDIT_EL = "data";

export class Flag extends InlineBase {
  constructor(init: FlagInit) {
    super({ name: "flag" });
  }

  create(option: FlagPayload): HTMLLabelElement {
    const { first, constrain } = option;

    constrain.join(",");
    const index = constrain.indexOf(first);
    if (index === -1) {
      throw new Error("constain must include value of first");
    }
    // const flag = createElement("svg", {
    //   dataset: { constrain, index },
    //   innerHTML: FLAG[first],
    // });
    const flag = createElement("img", { attributes: { src: FLAG[first] } });
    const root = createInline(this.name, [flag], { constrain, index });
    addMarkdownHint(root);

    return root;
  }

  toggleCheckbox() {
    if (this.current) {
      const check = this.current.querySelector("img")!;
      const constrain = this.current.dataset["constrain"]!.split(",");
      const index =
        (parseInt(this.current.dataset["index"]!) + 1) % constrain.length;
      this.current.dataset["index"] = index + "";
      const newFlag = FLAG[constrain[index] as FLAGKEY];
      check.src = newFlag;
      // check.replaceWith(...innerHTMLToNodeList(newFlag));
      this.submit(false);
    } else {
      throw new Error("Sanity check");
    }
  }

  hover_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    // const q = label.querySelector(EDIT_EL)!;
  }
  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    // this.component.dropdown.textContent = "waiting for menu";
    // this.float(label, this.component.dropdown, { placement: "bottom-start" });
    // this.hover_subclass(label, context);
    // const q = label.querySelector(EDIT_EL)!;
    // const { range } = context;
    // setRange(makeRangeInNode(q, range));
  }

  exit_subclass(label: HTMLLabelElement, context: BlockEventContext): void {}
}
