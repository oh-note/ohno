import {
  VirtualElement,
  computePosition,
  flip,
  autoUpdate,
} from "@floating-ui/dom";
import { markFloat } from "../status";

export interface FloatOption {
  xOffset?: number;
  yOffset?: number;
  autoUpdate?: boolean;
}

const defaultOption = {
  xOffset: 0,
  yOffset: 0,
  autoUpdate: false,
};

export class FloatingMixin {
  autoUpdateFlag?: () => void;

  markFloat(el: HTMLElement) {
    markFloat(el);
  }

  private _computePosition(
    reference: VirtualElement,
    floating: HTMLElement,
    opt: FloatOption
  ) {
    computePosition(reference, floating, {
      placement: "bottom-start",
      middleware: [flip()],
    }).then(({ x, y }) => {
      Object.assign(floating.style, {
        left: `${x + opt.xOffset!}px`,
        top: `${y + opt.yOffset!}px`,
      });
    });
  }

  stopAutoUpdate() {
    if (this.autoUpdateFlag) {
      this.autoUpdateFlag();
      this.autoUpdateFlag = undefined;
    }
  }

  computePosition(
    reference: VirtualElement,
    floating: HTMLElement,
    option: FloatOption = defaultOption
  ) {
    const opt = Object.assign(defaultOption, option);
    this.stopAutoUpdate();
    if (opt.autoUpdate) {
      this.autoUpdateFlag = autoUpdate(
        reference,
        floating,
        () => {
          this._computePosition(reference, floating, opt);
        },
        {
          animationFrame: true,
        }
      );
    } else {
      this._computePosition(reference, floating, opt);
    }
  }
}

export class TestMixin {}
