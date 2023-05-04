import { OrderedList } from "./block";
import { ListHandler, ListInit } from "../list";

export class OrderedListHandler extends ListHandler {
  public get ListBlockType(): new (init?: ListInit | undefined) => any {
    return OrderedList;
  }

  public get listStyleTypes(): string[] {
    return ["decimal", "lower-alpha", "lower-roman"];
  }
}
