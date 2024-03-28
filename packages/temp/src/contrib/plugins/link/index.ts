import { PluginComponent } from "@ohno/core/system/types";
// import {} from "./handler";
import { Link } from "./plugin";
import { LinkPluginHandler } from "./handler";

export { Link, LinkPluginHandler };
export function LinkPlugin(): PluginComponent {
  const manager = new Link();
  return {
    manager: manager,
    handlers: {
      plugins: new LinkPluginHandler(),
    },
  };
}
