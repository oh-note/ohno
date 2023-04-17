export * from "./handler";
import { Handlers } from "@system/page";
import { HeadingsHandler } from "./handler";

export * from "./handler";
export * from "./block";

export const HeadingHandlers: Handlers = {
  beforeHandler: new HeadingsHandler(),
};
