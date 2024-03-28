import {
  ChildrenData,
  CommandSet,
  Dict,
  EditableInterval,
  InlineSupport,
  ListCommandBuilder,
  RefLocation,
  ValidNode,
} from "../../../system/types";
import { ABCList, ListData } from "./block";
import {
  BackspacePayLoad,
  InnerHTMLExtra,
  CommonPayLoad,
  DeletePayLoad,
  EditableExtra,
  MultiBlockExtra,
  MultiBlockPayLoad,
} from "../../../system/block/command_set";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
  ContainerInsert,
  ContainerRemove,
  Empty,
  RichTextDelete,
  TextInsert,
} from "../../../contrib/commands";
import { Paragraph } from "../paragraph";
import {
  addMarkdownHint,
  createElement,
  createRange,
  getTokenSize,
  locationToBias,
  parentElementWithTag,
} from "../../../system/functional";
import { Flag } from "../../inlines";

export class ABCListCommandSet implements CommandSet<ABCList> {
  collapsedEnter(
    builder: ListCommandBuilder<CommonPayLoad<ABCList>, InnerHTMLExtra>
  ): void {
    const { block, range } = builder.payload;
    const editable = block.findEditable(range.startContainer)!;
    const index = block.getEditableIndex(editable);

    builder.addLazyCommand(({ block, page }, { innerHTML }) => {
      const todoFlagLoc = block.getLocation(1, index);
      const children: ChildrenData = [innerHTML];
      let hasFlag = false;
      if (todoFlagLoc && todoFlagLoc[0] instanceof HTMLLabelElement) {
        if (todoFlagLoc[0].dataset["name"] === "flag") {
          hasFlag = true;
          const plugin = page.getPlugin<InlineSupport>("inlinesupport");
          const manager = plugin.getInlineManager<Flag>("flag");
          const node = manager.create({
            first: "TODO",
            constrain: ["DONE", "TODO"],
          });
          children.unshift(node);
        }
      }

      const newLi = createElement("li", { children });
      addMarkdownHint(newLi);
      const typedBlock = block as ABCList;
      const oldLevel = typedBlock.getIndentLevel(editable);
      typedBlock.setIndentLevel(newLi, oldLevel);
      return new ContainerInsert({
        block: block,
        page: page,
        newContainer: [newLi],
        where: "below",
        index,
      })
        .onExecute(() => {
          block.updateValue();
          if (hasFlag) {
            page.setLocation(block.getLocation(2, index + 1)!, block);
          } else {
            page.setLocation(block.getLocation(0, index + 1)!, block);
          }
        })
        .onUndo(() => {
          block.updateValue();
        });
    });
  }

  deleteAtBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<ABCList>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ block, page, nextBlock }, { editables }) => {
      if (editables.length === 0) {
        // do nothing if no feeded input
        return;
      }

      if (nextBlock instanceof ABCList) {
        // insert all items when nextBlock is List
        return new ContainerInsert({
          newContainer: editables,
          block,
          page,
          index: -1,
          where: "below",
        }).onExecute(() => {
          block.updateValue();
        });
      } else {
        // insert first item when is not List
        const innerHTML = editables[0].innerHTML;
        const start = block.selection.getTokenSize(block.getEditable(-1));
        return new TextInsert({
          page,
          block,
          innerHTML,
          start,
          index: -1,
        }).onExecute(({ start, index }) => {
          page.setLocation(block.getLocation(start, index)!, block);
        });
      }
    });
  }

  deleteAtEditableEnd(
    builder: ListCommandBuilder<CommonPayLoad<ABCList<ListData>>, EditableExtra>
  ): void {
    const { block, range } = builder.payload;
    const start = block.getBias([range.startContainer, range.startOffset]);
    const editable = block.findEditable(range.startContainer)!;
    const index = block.getEditableIndex(editable);
    builder
      .addLazyCommand(({ block, page }, extra) => {
        // 1. remove next list item.
        const nextIndex = index + 1;
        extra.editables = [block.getNextEditable(editable)!];

        return new ContainerRemove({ block, page, indexs: [nextIndex] });
      })
      .addLazyCommand(({ block, page }, { editables }) => {
        // 2. insert next editable content into current list item.
        return new TextInsert({
          block,
          page,
          innerHTML: editables[0].innerHTML,
          start,
          index,
        }).onExecute(({ block, start, index }) => {
          page.setLocation(block.getLocation(start, index)!, block);
        });
      });
  }

  deleteFromPrevBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<ABCList>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ page, block, nextBlock }, extra) => {
      if (block instanceof ABCList) {
        // feed whole list items if prev block is List
        extra.editables = nextBlock
          .getEditables()
          .map((item) => item.cloneNode(true) as HTMLElement);
        return new BlockRemove({ page, block: nextBlock });
      } else {
        // feed first list item if prev block is not List
        extra.editables = [nextBlock.getFirstEditable()];
        if (nextBlock.length === 1) {
          return new BlockRemove({ block: nextBlock, page });
        } else {
          return new ContainerRemove({ block: nextBlock, indexs: [0], page });
        }
      }
    });
  }

  backspaceAtStart(
    builder: ListCommandBuilder<BackspacePayLoad<ABCList>, EditableExtra>
  ): "connect" | "independent" {
    const { page, block, range } = builder.payload;
    const count = block.getEditables().length;
    const liIndex = block.findEditableIndex(range.startContainer);
    if (count === 1) {
      // convert single li item into paragraph
      builder.addLazyCommand(({ page, block }) => {
        return new BlockReplace({
          block,
          page,
          newBlock: new Paragraph({
            children: block.getFirstEditable().innerHTML,
          }),
        });
      });
    } else {
      builder
        .addLazyCommand((_, extra) => {
          // 1. remove list items after liIndex (start Editable)
          const editables = block
            .getEditables()
            .filter((item, index) => index >= liIndex!);

          extra.editables = editables.map(
            (item) => item.cloneNode(true) as HTMLElement
          );

          const indexs = Array.from(
            { length: editables.length },
            (_, index) => index + liIndex
          );
          return new ContainerRemove({ page, block, indexs }).onUndo(
            ({ indexs }) => {
              page.setLocation(block.getLocation(0, indexs[0])!, block);
            }
          );
        })
        .addLazyCommand(({ page, block }, { editables }, status) => {
          // 2. make new List Block after liIndex
          if (editables.length === 1) {
            return;
          }
          return new BlockCreate({
            page,
            block,
            newBlock: page.createBlock<ABCList, ListData>(block.type, {
              children: editables
                .slice(1)
                .map((item: HTMLElement) => item.innerHTML),
            }),
            where: "after",
          }).removeCallback();
        })
        .addLazyCommand(({ page, block }, { editables }) => {
          // 3. convert editable of liIndex into Paragraph block
          return new BlockCreate({
            page,
            block,
            newBlock: new Paragraph({ children: editables[0].innerHTML }),
            where: "after",
          }).onUndo();
        })
        .addLazyCommand(({ block, page }) => {
          // 4. keep editables before liIndex, if not exists, remove empty List block.
          if (liIndex === 0) {
            return new BlockRemove({ block, page });
          }
          return;
        });
    }

    return "independent";
  }

  backspaceFromNextBlockStart(
    builder: ListCommandBuilder<BackspacePayLoad<ABCList>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ page, prevBlock }, { editables }) => {
      const token_number = prevBlock.selection.getTokenSize(
        prevBlock.getLastEditable()
      );
      if (editables.length == 0 || editables[0].innerHTML.length === 0) {
        return new Empty({ prevBlock }).onExecute(({ prevBlock }) => {
          page.setLocation(prevBlock.getLocation(token_number, -1)!, prevBlock);
        });
      }

      // insert first editable content into last of paragraph
      return new TextInsert({
        page: page,
        block: prevBlock,
        start: token_number,
        index: -1,
        innerHTML: editables[0].innerHTML,
      }).onExecute(({ block }) => {
        page.setLocation(block.getLocation(token_number, -1)!, block);
      });
    });
  }

  removeMultipleEditable(
    builder: ListCommandBuilder<CommonPayLoad<ABCList>, Dict>
  ): void {
    const { page, block, range } = builder.payload;
    const startIndex = block.findEditableIndex(range.startContainer);
    const endIndex = block.findEditableIndex(range.endContainer);
    const startBias = block.getBias([range.startContainer, range.startOffset]);
    const endBias = block.getBias([range.endContainer, range.endOffset]);
    const startTokenNumber =
      block.selection.getTokenSize(block.getEditable(startIndex)) - startBias;

    builder
      .addLazyCommand(() => {
        // 1. delete content after range start location in first editable
        return new RichTextDelete({
          block,
          page,
          start: startBias,
          index: startIndex,
          token_number: startTokenNumber,
        }).onUndo(() => {
          const startLoc = block.getLocation(startBias, startIndex)!;
          const endLoc = block.getLocation(endBias, endIndex)!;
          page.setRange(createRange(...startLoc, ...endLoc));
        });
      })
      .addLazyCommand(() => {
        // 2. delete content before range end location in last editable
        return new RichTextDelete({
          page,
          block,
          start: endBias,
          index: endIndex,
          token_number: -endBias,
        });
      })
      .addLazyCommand(() => {
        // 3. insert content of last bullet after deletion at the end of first bullet
        const editable = block.getEditable(endIndex);

        return new TextInsert({
          page,
          block,
          innerHTML: editable.innerHTML,
          start: startBias,
          index: startIndex,
        }).onExecute(({ block }) => {
          page.setLocation(block.getLocation(startBias, startIndex)!, block);
        });
      })
      .addLazyCommand(() => {
        // 4. remove all item list before last list item.
        return new ContainerRemove({
          block,
          page,
          indexs: Array(endIndex - startIndex)
            .fill(null)
            .map((item, index) => index + startIndex + 1),
        });
      });
  }
  pasteSplit(
    builder: ListCommandBuilder<
      CommonPayLoad<ABCList<ListData>>,
      InnerHTMLExtra
    >
  ): void {
    // 1. make current as paragraph
    // 2. make below as list
    const { page, block, range } = builder.payload;
    const count = block.getEditables().length;
    const liIndex = block.findEditableIndex(range.startContainer);
    if (count === 1) {
      // convert single li item into paragraph
      builder.addLazyCommand(({ page, block }) => {
        return new BlockReplace({
          block,
          page,
          newBlock: new Paragraph({
            children: block.getFirstEditable().innerHTML,
          }),
        });
      });
    } else {
      builder
        .addLazyCommand((_, extra) => {
          // 1. remove list items after liIndex (start Editable)
          const editables = block
            .getEditables()
            .filter((item, index) => index > liIndex!);

          extra.editables = editables.map(
            (item) => item.cloneNode(true) as HTMLElement
          );
          const indexs = Array.from(
            { length: editables.length },
            (_, index) => index + liIndex + 1
          );
          if (indexs.length === 0) {
            return;
          }
          return new ContainerRemove({ page, block, indexs }).onUndo(
            ({ indexs }) => {
              page.setLocation(block.getLocation(0, indexs[0])!, block);
            }
          );
        })
        .addLazyCommand(({ page, block }, { editables }, status) => {
          // 2. make new List Block after liIndex
          if (editables.length === 0) {
            return;
          }
          // debugger;
          return new BlockCreate({
            page,
            block,
            newBlock: page.createBlock<ABCList, ListData>(block.type, {
              children: editables.map((item: HTMLElement) => item.innerHTML),
            }),
            where: "after",
          }).removeCallback();
        })
        .addLazyCommand(({ page, block }, { innerHTML }) => {
          // 3. convert editable of liIndex into Paragraph block
          return new BlockCreate({
            page,
            block,
            newBlock: new Paragraph({ children: innerHTML }),
            where: "after",
          }).onUndo();
        })
        .addLazyCommand(({ block, page }) => {
          // 4. keep editables before liIndex, if not exists, remove empty List block.
          if (liIndex === 0) {
            return new BlockRemove({ block, page });
          }
          return;
        });
    }
  }

  multiblockMergeWhenIsFirst(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {
    builder.addLazyCommand(({ page, block }, { innerHTML }) => {
      return new TextInsert({ page, block, index: -1, innerHTML, start: -1 });
    });
  }

  multiblockMergeWhenIsLast(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {
    builder.addLazyCommand(({ page, endBlock }, extra) => {
      extra.innerHTML = endBlock.getEditable(0).innerHTML;
      return new ContainerRemove({ page, block: endBlock, indexs: [0] });
    });
  }

  multiblockPartSelectionRemove(
    builder: ListCommandBuilder<MultiBlockPayLoad, any>,
    option?: { isEnd?: boolean | undefined } | undefined
  ): void {
    const { isEnd } = option || {};

    if (isEnd) {
      const { endBlock, range } = builder.payload;
      const refLoc: RefLocation = [range.endContainer, range.endOffset];
      const endEditable = endBlock.findEditable(refLoc[0])!;
      const endIndex = endBlock.getEditableIndex(endEditable);
      const endBias = endBlock.getBias(refLoc);
      builder
        .addLazyCommand(({ page, endBlock }) => {
          return new RichTextDelete({
            page,
            block: endBlock,
            index: endIndex,
            start: 0,
            token_number: endBias,
          });
        })
        .addLazyCommand(({ page, endBlock }) => {
          if (endIndex === 0) {
            return;
          }
          return new ContainerRemove({
            page,
            block: endBlock,
            indexs: Array(endIndex)
              .fill(null)
              .map((_, index) => index),
          });
        });
    } else {
      const { block, range } = builder.payload;
      const refLoc: RefLocation = [range.startContainer, range.startOffset];
      const startEditable = block.findEditable(refLoc[0])!;
      const startBias = block.getBias(refLoc);
      const startIndex = block.getEditableIndex(startEditable);
      const startTokenNumber =
        block.selection.getTokenSize(startEditable) - startBias;

      builder
        .addLazyCommand(({ page, block }) => {
          return new RichTextDelete({
            page,
            block,
            index: startIndex,
            start: startBias,
            token_number: startTokenNumber,
          });
        })
        .addLazyCommand(({ page, block }) => {
          if (startIndex === block.length - 1) {
            return;
          }
          return new ContainerRemove({
            page,
            block,
            indexs: Array(block.length - startIndex - 1)
              .fill(null)
              .map((_, index) => index + startIndex + 1),
          });
        });
    }
  }
}
