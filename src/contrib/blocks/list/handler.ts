import { createElement, getDefaultRange } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import {
  FIRST_POSITION,
  LAST_POSITION,
  Offset,
  getTokenSize,
  locationToBias,
  offsetToRange,
  rangeToOffset,
  setOffset,
} from "@/system/position";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
} from "@/contrib/commands/block";
import { ValidNode, outerHTML, parentElementWithTag } from "@/helper/element";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { TextDeleteSelection } from "@/contrib/commands/text";

import { List } from "./block";
import { AnyBlock, Block } from "@/system/block";
import {
  ContainerInsert,
  ContainerRemove,
  SetContainerAttribute,
  UpdateContainerStyle,
} from "@/contrib/commands/container";
import { addMarkdownHint } from "@/helper/markdown";
import { Paragraph } from "../paragraph";
import { FormatMultipleText } from "@/contrib/commands/format";
import { formatTags } from "@/system/format";
import { TextInsert } from "@/contrib/commands";
import { ListInit } from "./block";
import { createRange, setRange } from "@/system/range";

export interface DeleteContext extends EventContext {
  nextBlock: AnyBlock;
}

export function prepareDeleteCommand({
  page,
  block,
  nextBlock,
}: DeleteContext) {
  const offset = block.getOffset();
  const containers = block.containers();
  const builder = new ListCommandBuilder({ page, block, nextBlock });
  if (offset.index === containers.length - 1) {
    // 在最后一个 index 时
    // 如果是 list ，就合并 BlockRemove -> ContainerCreate

    if (nextBlock.multiContainer) {
      builder
        .withLazyCommand(({ page, block, nextBlock }, extra) => {
          const containers = nextBlock
            .containers()
            .map((item) => item.cloneNode(true));
          extra["containers"] = containers;
          return new BlockRemove({
            block: nextBlock,
            page: page,
          });
        })
        .withLazyCommand(({ block, page }, { containers }) => {
          return new ContainerInsert({
            block: block,
            index: offset.index!,
            newContainer: containers,
            page,
            afterOffset: { ...LAST_POSITION, index: offset.index },
            where: "below",
          });
        });
    } else {
      // 如果是 paragraph，就 BlockRemove -> TextInsert

      builder
        .withLazyCommand(({ block, page }, extra) => {
          extra["innerHTML"] = nextBlock.root.innerHTML;

          return new BlockRemove({
            block: nextBlock,
            page: page,
          });
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          return new TextInsert(
            {
              block,
              page,
              insertOffset: offset,
              innerHTML,
            },
            ({ block, insertOffset }) => {
              block.setOffset(insertOffset);
            }
          );
        });
    }
  } else {
    // 在中间 index 时，将下一个 container 的内容合并， ContainerRemove -> TextInsert
    builder
      .withLazyCommand(({ block, page }, extra) => {
        const nextIndex = offset.index! + 1;
        extra["innerHTML"] = containers[nextIndex].innerHTML;

        return new ContainerRemove({ block, page, index: [nextIndex] });
      })
      .withLazyCommand(({ block, page }, { innerHTML }) => {
        return new TextInsert(
          { block, page, innerHTML, insertOffset: offset },
          ({ block, insertOffset }) => {
            block.setOffset(insertOffset);
          }
        ).onExecute(({ block, insertOffset }) => {
          block.setOffset(insertOffset);
        });
      });
  }
  return builder;
}

export function removeSelection({ range, page, block }: EventContext) {
  if (!range) {
    throw new NoRangeError();
  }
  const startLi = parentElementWithTag(range.startContainer, "li", block.root)!;
  const endLi = parentElementWithTag(range.endContainer, "li", block.root);

  const offsets: Offset[] = [];

  let offset: Offset;
  for (
    let i = block.getIndexOfContainer(startLi), li = startLi;
    ;
    i++, li = li.nextElementSibling as HTMLElement
  ) {
    if (li === startLi) {
      offset = {
        start: locationToBias(
          li,
          range.startContainer as ValidNode,
          range.startOffset
        ),
        end: getTokenSize(li),
        index: i,
      };
    } else if (li === endLi) {
      offset = {
        start: 0,
        end: locationToBias(
          li,
          range.endContainer as ValidNode,
          range.endOffset
        ),
        index: i,
      };
    } else {
      offset = {
        start: 0,
        end: getTokenSize(li),
        index: i,
      };
    }
    offsets.push(offset);
    if (li === endLi) {
      break;
    }
  }

  const builder = new ListCommandBuilder({ page, block })
    .withLazyCommand(() => {
      return new TextDeleteSelection({
        block,
        page,
        delOffset: offsets[offsets.length - 1],
      }).onUndo(() => {
        // debugger;
        const [startContainer, startOffset] = block.getLocation(
          offsets[0].start,
          { index: offsets[0].index }
        )!;
        const [endContainer, endOffset] = block.getLocation(
          offsets[offsets.length - 1].end!,
          {
            index: offsets[offsets.length - 1].index,
          }
        )!;
        setRange(
          createRange(startContainer, startOffset, endContainer, endOffset)
        );
        // block.getLocation(delOffset.start, { index: delOffset.index });
      });
    })
    .withLazyCommand(() => {
      offsets[0].start;
      return new TextDeleteSelection({
        block,
        page,
        delOffset: offsets[0],
      });
    })
    .withLazyCommand(() => {
      const container = block.getContainer(offsets[offsets.length - 1].index);
      return new TextInsert({
        page,
        block,
        innerHTML: container.innerHTML,
        insertOffset: { ...LAST_POSITION, index: offsets[0].index },
      }).onExecute(({ block, insertOffset }) => {
        const [startContainer, startOffset] = block.getLocation(
          insertOffset.start,
          { index: insertOffset.index }
        )!;
        setRange(createRange(startContainer, startOffset));
      });
    })
    .withLazyCommand(() => {
      return new ContainerRemove({
        block,
        page,
        index: offsets.slice(1).map((item) => item.index!),
      });
    });
  return builder;
}

export class ListHandler extends Handler implements KeyDispatchedHandler {
  name: string = "list";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    { range, page, block }: RangedEventContext
  ): boolean | void {
    //  只有在 单
    if (range.collapsed) {
      // 应该由 composition 解决
      throw new Error("Can't handle this situation");
    }
    let command;

    if (parentElementWithTag(range.commonAncestorContainer, "li", block.root)) {
      // 没有跨 container
      const container = block.findContainer(range.commonAncestorContainer)!;
      const index = block.getIndexOfContainer(container);
      const offset = { ...rangeToOffset(container, range), index };
      command = new TextDeleteSelection({
        page,
        block,
        delOffset: offset,
      }).onExecute(({ block }) => {
        block.setOffset({ ...offset, end: undefined });
      });
    } else {
      const builder = removeSelection({ page, block, range });
      command = builder.build();
    }
    page.executeCommand(command);

    return true;
  }
  handleDeleteDown(
    e: KeyboardEvent,
    { page, block }: EventContext
  ): boolean | void {
    const range = getDefaultRange();

    // 非 collapse 情况下都应该由 beforeInput 处理
    if (!block.isRight(range) || !range.collapsed) {
      return;
    }

    const nextBlock = page.getNextBlock(block);
    if (!nextBlock) {
      // 在右下方，不做任何操作
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    // 需要将下一个 Block 的第一个 Container 删除，然后添加到尾部
    // 执行过程是 TextInsert -> ContainerDelete
    const command = prepareDeleteCommand({ page, block, nextBlock }).build();
    page.executeCommand(command);
    return true;
  }

  public get listStyleTypes(): string[] {
    return ["disc", "circle", "square"];
  }

  updateValue({ block }: EventContext) {
    const containers = block.containers();
    const lvstack: number[] = [];
    containers.forEach((container, ind, arr) => {
      const level = parseFloat(container.getAttribute("data-level") || "0");
      while (lvstack[level] === undefined) {
        lvstack.push(0);
      }
      while (level < lvstack.length - 1) {
        lvstack.pop();
      }
      lvstack[level]++;
      container.setAttribute("value", lvstack[level] + "");
      // this.updateLi(container, null, ind, lvstack[level]);
    });
  }

  indent(context: EventContext, add: boolean = true) {
    const { page, block } = context;
    const container = block.currentContainer();
    const index = block.getIndexOfContainer(container);
    const command = new ListCommandBuilder({ block, index, container })
      .withLazyCommand(({ block, index, container }) => {
        let level = this.getLevelOfContainer(container as HTMLLIElement);
        if (add) {
          level = Math.min(level + 1, 3);
        } else {
          level = Math.max(level - 1, 0);
        }

        return new SetContainerAttribute({
          block,
          index,
          name: "data-level",
          value: `${level}`,
        });
      })
      .withLazyCommand(({ block, index, container }) => {
        const level = parseInt(container.getAttribute("data-level") || "0");
        const types = this.listStyleTypes;
        return new UpdateContainerStyle({
          block,
          index,
          style: {
            marginLeft: `${level * 20}px`,
            listStyleType: types[level % types.length],
          },
        }).onExecute(() => {
          this.updateValue(context);
        });
      })
      .build();
    page.executeCommand(command);
  }

  handleTabDown(e: KeyboardEvent, context: EventContext): boolean | void {
    this.indent(context, !e.shiftKey);
    return true;
  }

  public get ListBlockType(): new (init?: ListInit) => any {
    return List;
  }
  getLevelOfContainer(container: HTMLLIElement) {
    return parseInt(container.getAttribute("data-level") || "0");
  }

  handleBackspaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { block, page, range } = context;
    if (!range) {
      throw new NoRangeError();
    }
    if (!block.isLeft(range) || !range.collapsed) {
      return;
    }
    // 此时一定是非选中状态下在最左侧按下 BackSpace
    const offset = block.getOffset(range);
    const container = block.getContainer(offset.index);
    const level = this.getLevelOfContainer(container as HTMLLIElement);
    if (level > 0) {
      this.indent(context, false);
      return true;
    }

    let command;
    const cn = block.containers().length;
    if (cn === 1) {
      command = new BlockReplace({
        block,
        page,
        offset: FIRST_POSITION,
        newBlock: new Paragraph({
          innerHTML: block.firstContainer().innerHTML,
        }),
        newOffset: FIRST_POSITION,
      });
    } else {
      // 只需要考虑 Paragraph 类和 List 类型的退格删除导致的 Block 间信息增删行为
      // 对这两种删除行为，List 是将退格部分转化为 Paragraph（可能导致 List 分裂成两个）
      // Paragraph 是将整个 Block 的内容 put 到上一个 Block 的 LastContainer 中
      // 对 Paragraph，只需要 BlockRemove 和 TextInsert 两个命令的组合，即可完成这一操作
      // 对 List，还需要额外分析退格的 Container Index，并额外的创建 1 或 2 个 BlockCreate 命令
      command = new ListCommandBuilder({ page, block })
        .withLazyCommand((_, extra) => {
          // 删除 index 之后的全部 Container(包括 index)，但是保留内容
          const containers = block
            .containers()
            .filter((item, index) => index >= offset.index!);
          extra["containers"] = containers.map((item) => item.cloneNode(true));
          const index = Array.from(
            { length: containers.length },
            (_, index) => index + offset.index!
          );
          return new ContainerRemove({ page, block, index }).onUndo(
            ({ index }) => {
              block.setOffset({ index: index[0], start: 0 });
            }
          );
        })
        .withLazyCommand(({ page, block }, { containers }, status) => {
          if (containers.length === 1) {
            return;
          }
          // BackSpace 光标之后的行
          return new BlockCreate({
            page,
            block,
            offset: FIRST_POSITION,
            newBlock: new this.ListBlockType({
              children: (containers as HTMLElement[]).slice(
                1
              ) as HTMLLIElement[],
            }),
            newOffset: FIRST_POSITION,
            where: "after",
          }).removeCallback();
        })
        .withLazyCommand(({ page, block }, { containers }) => {
          // backspace 对应的行
          return new BlockCreate({
            page,
            block,
            offset: FIRST_POSITION,
            newBlock: new Paragraph({ innerHTML: containers[0].innerHTML }),
            newOffset: FIRST_POSITION,
            where: "after",
          }).onUndo();
        })
        .withLazyCommand(({ block, page }) => {
          // BackSpace 之前的行（默认不做操作，如果之前没有行了，则将 block 删除）
          if (offset.index === 0) {
            return new BlockRemove({ block, page });
          }
          return;
        })
        .build();
    }

    page.executeCommand(command);
    // 向前合并
    return true;
  }

  updateView(context: EventContext) {}

  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { page, block, range } = context;
    e.stopPropagation();
    e.preventDefault();
    if (!range) {
      throw new NoRangeError();
    }

    // 检测是否跨 Container
    if (parentElementWithTag(range.commonAncestorContainer, "li", block.root)) {
      // 没有跨 Container
      // 先删除当前选中
      // 再删除光标后内容
      // 再将光标后内容作为新内容插入
      const builder = new ListCommandBuilder({
        page,
        block,
        range,
      })
        .withLazyCommand(({ range }) => {
          if (range.collapsed) {
            // 没有选中文本，不需要删除
            return;
          }
          const delOffset: Offset = block.getOffset(range);
          const command = new TextDeleteSelection({
            page,
            block,
            delOffset,
          }).onUndo(({ block, delOffset }) => {
            block.setOffset(delOffset);
          });
          return command;
        })
        .withLazyCommand(({ block, page, range }, extra, status) => {
          const container = block.findContainer(range.startContainer)!;
          const index = block.getIndexOfContainer(container);
          const token_number = getTokenSize(container);
          if (block.isRight(range, container)) {
            // 已经在最右侧了，直接返回并新建 Block
            extra["innerHTML"] = "";
            extra["index"] = index;
            extra["token_number"] = token_number;
            return;
          }
          // 获取光标到右侧的文本，删除并将其作为新建 Block 的参数
          const offset: Offset = {
            start: locationToBias(
              container,
              range.startContainer as ValidNode,
              range.startOffset
            ),
            end: getTokenSize(container),
            index,
          };

          const tailSelectedRange = offsetToRange(container, offset);
          const newContent = tailSelectedRange!.cloneContents();

          extra["innerHTML"] = outerHTML(newContent);
          extra["index"] = index;
          extra["token_number"] = token_number;
          return new TextDeleteSelection({
            block: block,
            page: page,
            beforeOffset: { ...offset, end: undefined },
            delOffset: offset,
          });
        })
        .withLazyCommand(({ block, page }, { innerHTML, index }) => {
          if (innerHTML === undefined || index === undefined) {
            throw new Error("sanity check");
          }
          const newLi = createElement("li");
          newLi.innerHTML = innerHTML;
          addMarkdownHint(newLi);

          return new ContainerInsert({
            block: block,
            page: page,
            newContainer: [newLi],
            where: "below",
            index,
          })
            .onExecute(() => {
              this.updateValue(context);
            })
            .onUndo(() => {
              this.updateValue(context);
            });
        });
      const command = builder.build();
      page.executeCommand(command);
      return true;
    }

    const startLi = parentElementWithTag(
      range.startContainer,
      "li",
      block.root
    )!;
    const endLi = parentElementWithTag(range.endContainer, "li", block.root)!;
    const startIndex = block.getIndexOfContainer(startLi);
    const endIndex = block.getIndexOfContainer(endLi);

    const startOffset = {
      start: locationToBias(
        startLi,
        range.startContainer as ValidNode,
        range.startOffset
      ),
      end: getTokenSize(startLi),
      index: startIndex,
    };
    const endOffset = {
      start: 0,
      end: locationToBias(
        endLi,
        range.endContainer as ValidNode,
        range.endOffset
      ),
      index: endIndex,
    };

    const blockOffset = block.getGlobalOffset(range);
    const builder = new ListCommandBuilder({ page, block })
      .withLazyCommand(() => {
        return new TextDeleteSelection({
          block,
          page,
          delOffset: startOffset,
        }).onUndo(({ block }) => {
          block.setGlobalOffset(blockOffset);
        });
      })
      .withLazyCommand(() => {
        return new TextDeleteSelection({
          block,
          page,
          delOffset: endOffset,
        }).onExecute(({ block, delOffset }) => {
          block.setOffset({ start: 0, index: delOffset.index });
        });
      })
      .withLazyCommand(() => {
        const index = Array.from(
          Array(endIndex - startIndex - 1),
          (_, index) => {
            return index + startIndex + 1;
          }
        );
        return new ContainerRemove({
          block,
          page,
          index: index,
        })
          .onExecute(() => {
            this.updateValue(context);
          })
          .onUndo(() => {
            this.updateValue(context);
          });
      });
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleBeforeInput(e: TypedInputEvent, context: EventContext): boolean | void {
    const { block, page, range } = context;
    if (!range) {
      throw new NoRangeError();
    }

    // 检测是否跨 Container
    if (parentElementWithTag(range.commonAncestorContainer, "li", block.root)) {
      return;
    }

    const startLi = parentElementWithTag(
      range.startContainer,
      "li",
      block.root
    )!;
    const endLi = parentElementWithTag(range.endContainer, "li", block.root);

    const offsets: Offset[] = [];

    let offset: Offset;
    for (
      let i = block.getIndexOfContainer(startLi), li = startLi;
      ;
      i++, li = li.nextElementSibling as HTMLElement
    ) {
      if (li === startLi) {
        offset = {
          start: locationToBias(
            li,
            range.startContainer as ValidNode,
            range.startOffset
          ),
          end: getTokenSize(li),
          index: i,
        };
      } else if (li === endLi) {
        offset = {
          start: 0,
          end: locationToBias(
            li,
            range.endContainer as ValidNode,
            range.endOffset
          ),
          index: i,
        };
      } else {
        offset = {
          start: 0,
          end: getTokenSize(li),
          index: i,
        };
      }
      offsets.push(offset);
      if (li === endLi) {
        break;
      }
    }

    let command;
    const blockOffset = block.getGlobalOffset(range);
    if (
      e.inputType === "formatBold" ||
      e.inputType === "formatItalic" ||
      e.inputType === "formatUnderline"
    ) {
      const format = formatTags[e.inputType]!;
      command = new FormatMultipleText({
        areas: offsets.map((item) => {
          return {
            block: block,
            offset: item,
          };
        }),
        page,
        format,
      });
    } else {
      // 下面这些都是要先把选中内容删干净，即跨 Container 的删除
      const builder = new ListCommandBuilder({ page, block })
        .withLazyCommand(() => {
          return new TextDeleteSelection({
            block,
            page,
            delOffset: offsets[offsets.length - 1],
          }).onUndo(() => {
            block.setGlobalOffset(blockOffset);
          });
        })
        .withLazyCommand(() => {
          offsets[0].start;
          return new TextDeleteSelection({
            block,
            page,
            delOffset: offsets[0],
          });
        })
        .withLazyCommand((_, extra) => {
          const container = block.getContainer(
            offsets[offsets.length - 1].index
          );
          return new TextInsert({
            page,
            block,
            innerHTML: container.innerHTML,
            insertOffset: { ...LAST_POSITION, index: offsets[0].index },
          }).onExecute(({ block, insertOffset }) => {
            block.setOffset(insertOffset);
          });
        })
        .withLazyCommand(() => {
          return new ContainerRemove({
            block,
            page,
            index: offsets.slice(1).map((item) => item.index!),
          })
            .onUndo(() => {
              this.updateValue(context);
            })
            .onExecute(() => {
              this.updateValue(context);
            });
        });

      if (e.inputType === "insertText") {
        builder.withLazyCommand(({ page, block }) => {
          return new TextInsert({
            page,
            block,
            innerHTML: e.data as string,
            insertOffset: { ...offsets[0], end: undefined },
          });
        });

        command = builder.build();
      } else if (e.inputType === "insertFromPaste") {
        command = builder.build();
      } else if (
        e.inputType === "deleteContentBackward" ||
        e.inputType === "deleteContentForward" ||
        e.inputType === "deleteSoftLineBackward" ||
        e.inputType === "deleteWordBackward" ||
        e.inputType === "deleteWordForward"
      ) {
        command = builder.build();
      } else {
        console.log(e);
        return true;
      }
    }
    if (command) {
      page.executeCommand(command);
    }
    console.log(e);

    return true;
  }
}
