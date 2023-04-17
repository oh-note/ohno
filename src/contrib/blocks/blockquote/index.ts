import { Handlers } from "@system/page";
import { BlockQuoteHandler } from "./handler";

export * from "./handler";
export * from "./block";

export const BlockquoteHandlers: Handlers = {
  beforeHandler: new BlockQuoteHandler(),
};
