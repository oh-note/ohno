import { InlineComponent } from "@ohno-editor/core/system/page";
import { TodoItemHandler } from "./handler";
import { TodoItem, TodoItemInit, TodoitemOption } from "./inline";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";

export { TodoItem, TodoItemHandler };
export function TodoItemInline(init: TodoItemInit): InlineComponent {
  const instance = new TodoItem(init);
  const handler = new TodoItemHandler();
  return {
    manager: instance,
    onPageCreated: (page) => {
      const inline = page.getPlugin<InlineSupport>("inlinesupport");
      if (inline) {
        inline.registerHandler(handler, instance);
      }
    },
  };
}
