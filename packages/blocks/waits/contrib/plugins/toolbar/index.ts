import { PluginComponent } from "../../../system/types";
// import {} from "./handler";
import { Toolbar } from "./plugin";
import { ToolbarPluginHandler } from "./handler";
import { computePosition } from "@floating-ui/dom";

export { Toolbar, ToolbarPluginHandler };
export function ToolbarPlugin(): PluginComponent {
  const manager = new Toolbar({
    buttonGroup: [
      {
        buttons: [],
      },
    ],
  });
  return {
    manager: manager,
    handlers: {
      plugins: new ToolbarPluginHandler(),
    },
    onPageCreated: (page) => {
      computePosition(page.root, manager.root, {
        placement: "top-start",
        middleware: [],
      }).then(({ x, y }) => {
        Object.assign(manager.root.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    },
  };
}
