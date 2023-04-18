import { Handlers } from "@system/page";
import { ListHandler } from "./handler";

export * from "./handler";
export * from "./block";

export const ListHandlers: Handlers = {
  beforeHandler: new ListHandler(),
};
