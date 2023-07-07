import { InlineComponent } from "@ohno-editor/core/system/types";
import { TodoItemHandler } from "./handler";
import { TodoItem, TodoItemInit } from "./inline";
import { InlineSupport } from "@ohno-editor/core/system/inline";

export { TodoItem, TodoItemHandler };
export function TodoItemInline(init: TodoItemInit): InlineComponent {
  const instance = new TodoItem(init);
  const handler = new TodoItemHandler();
  return {
    name: "todoitem",
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
  };
}
