import { createElement } from "@/helper/document";
import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import {
  LAST_POSITION,
  getTokenSize,
  locationToBias,
  tokenBetweenRange,
} from "@/system/position";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
} from "@/contrib/commands/block";
import { ValidNode, outerHTML, parentElementWithTag } from "@/helper/element";
import { ListCommandBuilder } from "@/contrib/commands/concat";
// import { TextDeleteSelection } from "@/contrib/commands/text";

import { List } from "./block";
import { AnyBlock } from "@/system/block";
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
import { RichTextDelete, TextInsert } from "@/contrib/commands";
import { ListInit } from "./block";
import { createRange, setLocation, setRange } from "@/system/range";
import { EditableInterval } from "@/system/base";

export interface DeleteContext extends RangedEventContext {
  nextBlock: AnyBlock;
}

export function prepareDeleteCommand({
  page,
  block,
  range,
  nextBlock,
}: DeleteContext) {
  // const offset = block.getOffset();
  const start = block.getBias([range.startContainer, range.startOffset]);
  const editable = block.getCurrentEditable();
  const index = block.getEditableIndex(editable);
  const containers = block.getEditables();
  const builder = new ListCommandBuilder({ page, block, nextBlock });
  if (index === containers.length - 1) {
    // 在最后一个 index 时
    // 如果是 list ，就合并 BlockRemove -> ContainerCreate

    if (nextBlock.isMultiEditable) {
      builder
        .withLazyCommand(({ page, block, nextBlock }, extra) => {
          const containers = nextBlock
            .getEditables()
            .map((item) => item.cloneNode(true));
          extra["containers"] = containers;
          return new BlockRemove({
            block: nextBlock,
            page: page,
          });
        })
        .withLazyCommand(({ block, page }, { containers }) => {
          return new ContainerInsert({
            page,
            block,
            index,
            newContainer: containers,
            afterOffset: { ...LAST_POSITION, index },
            where: "below",
          });
        });
    } else {
      // 如果是 paragraph，就 BlockRemove -> TextInsert

      builder
        .withLazyCommand(({ page }, extra) => {
          extra["innerHTML"] = nextBlock.root.innerHTML;
          return new BlockRemove({
            page,
            block: nextBlock,
          });
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          return new TextInsert({
            page,
            block,
            start,
            index,
            // insertOffset: offset,
            innerHTML,
          }).onExecute(({ block, start, index }) => {
            setLocation(block.getLocation(start, index)!);
          });
        });
    }
  } else {
    // 在中间 index 时，将下一个 container 的内容合并， ContainerRemove -> TextInsert
    builder
      .withLazyCommand(({ block, page }, extra) => {
        const nextIndex = index + 1;
        extra["innerHTML"] = containers[nextIndex].innerHTML;

        return new ContainerRemove({ block, page, indexs: [nextIndex] });
      })
      .withLazyCommand(({ block, page }, { innerHTML }) => {
        return new TextInsert({
          block,
          page,
          innerHTML,
          start,
          index,
        }).onExecute(({ block, start, index }) => {
          setLocation(block.getLocation(start, index)!);
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

  const offsets: EditableInterval[] = [];

  let offset: EditableInterval;
  for (
    let i = block.getEditableIndex(startLi), li = startLi;
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
      const { start, index } = offsets[offsets.length - 1];
      const token_number = offsets[offsets.length - 1].end - start;
      return new RichTextDelete({
        block,
        page,
        start: offsets[offsets.length - 1].start,
        index,
        token_number,
      }).onUndo(() => {
        const startLoc = block.getLocation(offsets[0].start, offsets[0].index)!;
        const endLoc = block.getLocation(
          offsets[offsets.length - 1].end,
          offsets[offsets.length - 1].index
        )!;
        setRange(createRange(...startLoc, ...endLoc));
      });
    })
    .withLazyCommand(() => {
      const { start, index } = offsets[0];
      const token_number = offsets[0].end - start;
      return new RichTextDelete({ page, block, start, index, token_number });
    })
    .withLazyCommand(() => {
      const editable = block.getEditable(offsets[offsets.length - 1].index);
      const { index } = offsets[offsets.length - 1];
      return new TextInsert({
        page,
        block,
        innerHTML: editable.innerHTML,
        start: 0,
        index,
      }).onExecute(({ block }) => {
        const { start, index } = offsets[0];
        setLocation(block.getLocation(start, index)!);
      });
    })
    .withLazyCommand(() => {
      return new ContainerRemove({
        block,
        page,
        indexs: offsets.slice(1).map((item) => item.index!),
      });
    });
  return builder;
}

export class ListHandler extends Handler implements FineHandlerMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    { range, page, block }: RangedEventContext
  ): boolean | void {
    //  只有在 单
    if (range.collapsed) {
      // 应该由 composition 解决
      return;
    }
    let command;

    if (parentElementWithTag(range.commonAncestorContainer, "li", block.root)) {
      // 没有跨 container
      const editable = block.findEditable(range.commonAncestorContainer)!;
      const index = block.getEditableIndex(editable);
      const token_number = tokenBetweenRange(range);
      const start = block.getBias([range.startContainer, range.startOffset]);
      const end = block.getBias([range.endContainer, range.endOffset]);
      command = new RichTextDelete({
        page,
        block,
        start,
        index,
        token_number,
      })
        .onExecute(({ block }) => {
          setLocation(block.getLocation(start, index)!);
        })
        .onUndo(({ block }) => {
          setRange(block.getRange({ start, end }, index)!);
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
    { page, block, range }: RangedEventContext
  ): boolean | void {
    // 非 collapse 情况下都应该由 beforeInput 处理
    if (
      !range.collapsed ||
      !block.isLocationInRight([range.startContainer, range.startOffset])
    ) {
      return;
    }
    // TODO 合并下一个 Editable

    const nextBlock = page.getNextBlock(block);
    if (!nextBlock) {
      // 在右下方，不做任何操作
      return true;
    }

    // 需要将下一个 Block 的第一个 Container 删除，然后添加到尾部
    // 执行过程是 TextInsert -> ContainerDelete
    const command = prepareDeleteCommand({
      page,
      block,
      nextBlock,
      range,
    }).build();
    page.executeCommand(command);
    return true;
  }

  public get listStyleTypes(): string[] {
    return ["disc", "circle", "square"];
  }

  updateValue({ block }: EventContext) {
    const containers = block.getEditables();
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
    const container = block.getCurrentEditable();
    const index = block.getEditableIndex(container);
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

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { block, page, range } = context;
    if (
      !range.collapsed ||
      !block.isLocationInLeft([range.startContainer, range.startOffset])
    ) {
      return;
    }
    // 此时一定是非选中状态下在最左侧按下 BackSpace
    // const offset = block.getOffset(range);
    const container = block.findEditable(range.startContainer)!;
    const liIndex = block.getEditableIndex(container);
    // const container = block.getContainer(offset.index);
    const level = this.getLevelOfContainer(container as HTMLLIElement);
    if (level > 0) {
      this.indent(context, false);
      return true;
    }

    let command;
    const cn = block.getEditables().length;
    if (cn === 1) {
      // 仅剩一个 Editable 时，将整个block 替换为 paragraph 即可
      command = new BlockReplace({
        block,
        page,
        newBlock: new Paragraph({
          innerHTML: block.getFirstEditable().innerHTML,
        }),
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
            .getEditables()
            .filter((item, index) => index >= liIndex!);
          extra["containers"] = containers.map((item) => item.cloneNode(true));
          const indexs = Array.from(
            { length: containers.length },
            (_, index) => index + liIndex
          );
          return new ContainerRemove({ page, block, indexs }).onUndo(
            ({ indexs }) => {
              setLocation(block.getLocation(0, indexs[0])!);
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
            newBlock: new this.ListBlockType({
              children: (containers as HTMLElement[]).slice(
                1
              ) as HTMLLIElement[],
            }),
            where: "after",
          }).removeCallback();
        })
        .withLazyCommand(({ page, block }, { containers }) => {
          // backspace 对应的行
          return new BlockCreate({
            page,
            block,
            newBlock: new Paragraph({ innerHTML: containers[0].innerHTML }),
            where: "after",
          }).onUndo();
        })
        .withLazyCommand(({ block, page }) => {
          // BackSpace 之前的行（默认不做操作，如果之前没有行了，则将 block 删除）
          if (liIndex === 0) {
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

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { page, block, range } = context;
    // 检测是否跨 Container
    if (parentElementWithTag(range.commonAncestorContainer, "li", block.root)) {
      // 没有跨 Container
      // 先删除当前选中
      // 再删除光标后内容
      // 再将光标后内容作为新内容插入
      const editable = block.findEditable(range.startContainer)!;
      const index = block.getEditableIndex(editable);

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
          const start = block.getBias([
            range.startContainer,
            range.startOffset,
          ]);
          const token_number = tokenBetweenRange(range);

          const command = new RichTextDelete({
            page,
            block,
            index,
            start,
            token_number,
          }).onUndo(({ block, start, index }) => {
            setRange(
              block.getRange({ start, end: start + token_number }, index)!
            );
          });
          return command;
        })
        .withLazyCommand(({ block, page, range }, extra, status) => {
          const full_token_number = getTokenSize(editable);
          if (
            block.isLocationInRight([range.startContainer, range.startOffset])
          ) {
            // 已经在最右侧了，直接返回并新建 Block
            extra["innerHTML"] = "";
            return;
          }

          // 获取光标到右侧的文本，删除并将其作为新建 Block 的参数
          const start = block.getBias([
            range.startContainer,
            range.startOffset,
          ]);
          const tailSelectedRange = block.getRange(
            {
              start,
              end: full_token_number,
            },
            editable
          )!;
          const newContent = tailSelectedRange!.cloneContents();

          extra["innerHTML"] = outerHTML(newContent);
          return new RichTextDelete({
            page: page,
            block: block,
            index,
            start,
            token_number: full_token_number - start,
          }).onUndo(({ block, start, index }) => {
            setLocation(block.getLocation(start, index)!);
          });
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          if (innerHTML === undefined) {
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
              setLocation(block.getLocation(0, index + 1)!);
            })
            .onUndo(() => {
              this.updateValue(context);
            });
        });
      const command = builder.build();
      page.executeCommand(command);
      return true;
    }

    // 跨多个 li 选中
    const startLi = parentElementWithTag(
      range.startContainer,
      "li",
      block.root
    )!;
    const startIndex = block.getEditableIndex(startLi);
    const endLi = parentElementWithTag(range.endContainer, "li", block.root)!;
    const endIndex = block.getEditableIndex(endLi);

    // const startOffset = {
    //   start: locationToBias(
    //     startLi,
    //     range.startContainer as ValidNode,
    //     range.startOffset
    //   ),
    //   end: getTokenSize(startLi),
    //   index: startIndex,
    // };
    // const endOffset = {
    //   start: 0,
    //   end: locationToBias(
    //     endLi,
    //     range.endContainer as ValidNode,
    //     range.endOffset
    //   ),
    //   index: endIndex,
    // };

    const globalStart = block.getGlobalBias([
      range.startContainer,
      range.startOffset,
    ]);
    const globalEnd = block.getGlobalBias([
      range.startContainer,
      range.startOffset,
    ]);

    // const command = new RichTextDelete()

    const builder = new ListCommandBuilder({ page, block })
      .withLazyCommand(({ page, block }, extra) => {
        const start = block.getBias([range.startContainer, range.startOffset]);
        extra["start"] = start;

        return new RichTextDelete({
          page,
          block,
          start,
          index: startIndex,
          token_number: getTokenSize(startLi) - start,
        }).onUndo(({ block }) => {
          block.getRange({ start: globalStart, end: globalEnd });
        });
      })
      .withLazyCommand(() => {
        const token_number = block.getBias([
          range.endContainer,
          range.endOffset,
        ]);
        return new RichTextDelete({
          page,
          block,
          start: 0,
          index: endIndex,
          token_number,
        }).onExecute(({ block, start, index }) => {
          setLocation(block.getLocation(-1, startIndex)!);
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
          indexs: index,
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

    const offsets: EditableInterval[] = [];

    let offset: EditableInterval;
    for (
      let i = block.getEditableIndex(startLi), li = startLi;
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
    const globalStart = block.getGlobalBias([
      range.startContainer,
      range.startOffset,
    ]);
    const globalEnd = block.getGlobalBias([
      range.endContainer,
      range.endOffset,
    ]);
    // const blockOffset = block.getGlobalOffset(range);
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
          // delOffset: offsets[offsets.length - 1],
          const { start, index } = offsets[offsets.length - 1];
          const token_number = offsets[offsets.length - 1].end - start;
          return new RichTextDelete({
            block,
            page,
            start,
            index,
            token_number,
          }).onUndo(() => {
            setRange(block.getRange({ start: globalStart, end: globalEnd })!);
          });
        })
        .withLazyCommand(() => {
          const { start, index } = offsets[0];
          const token_number = offsets[0].end - start;
          return new RichTextDelete({
            block,
            page,
            start,
            index,
            token_number,
          });
        })
        .withLazyCommand(() => {
          const editable = block.getEditable(offsets[offsets.length - 1].index);
          const { index } = offsets[offsets.length - 1];

          return new TextInsert({
            page,
            block,
            innerHTML: editable.innerHTML,
            start: getTokenSize(editable),
            index,
          }).onExecute(({ block, start, index }) => {
            setLocation(block.getLocation(start, index)!);
          });
        })

        .withLazyCommand(() => {
          return new ContainerRemove({
            block,
            page,
            indexs: offsets.slice(1).map((item) => item.index!),
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
          // insertOffset: { ...offsets[0], end: undefined },
          const { start, index } = offsets[0];
          return new TextInsert({
            page,
            block,
            innerHTML: e.data as string,
            start,
            index,
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
