import { createElement } from "@ohno-editor/core/helper/document";
import {
  BlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import {
  getTokenSize,
  locationToBias,
  tokenBetweenRange,
} from "@ohno-editor/core/system/position";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
} from "@ohno-editor/core/contrib/commands/block";
import {
  ValidNode,
  outerHTML,
  parentElementWithTag,
  prevValidSibling,
} from "@ohno-editor/core/helper/element";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
// import { TextDeleteSelection } from "@ohno-editor/core/contrib/commands/text";

import { List } from "./block";
import { AnyBlock } from "@ohno-editor/core/system/block";
import {
  ContainerInsert,
  ContainerRemove,
  SetContainerAttribute,
  UpdateContainerStyle,
} from "@ohno-editor/core/contrib/commands/container";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import { Paragraph } from "../paragraph";
import { FormatMultipleText } from "@ohno-editor/core/contrib/commands/format";
import { formatTags } from "@ohno-editor/core/system/format";
import {
  NodeInsert,
  RichTextDelete,
  TextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands";
import { ListData } from "./block";
import { createRange } from "@ohno-editor/core/system/range";
import { EditableInterval } from "@ohno-editor/core/system/base";
import { InlineSupport } from "../../plugins";
import { Flag } from "../../inlines/flag/inline";
import { ListDentCommand } from "./command";

export interface DeleteContext extends RangedBlockEventContext {
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
  const editable = block.findEditable(range.startContainer)!;
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
            page.setLocation(block.getLocation(start, index)!, block);
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
          page.setLocation(block.getLocation(start, index)!, block);
        });
      });
  }

  return builder;
}

export function removeSelection({ range, page, block }: BlockEventContext) {
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
        page.setRange(createRange(...startLoc, ...endLoc));
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
        page.setLocation(block.getLocation(start, index)!, block);
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

export class ListHandler implements PagesHandleMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    { range, page, block }: RangedBlockEventContext
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
          page.setLocation(block.getLocation(start, index)!, block);
        })
        .onUndo(({ block }) => {
          page.setRange(block.getRange({ start, end }, index)!);
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
    { page, block, range }: RangedBlockEventContext
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

  updateValue({ block }: BlockEventContext) {
    const containers = block.getEditables();
    const lvstack: number[] = [];
    containers.forEach((container, ind, arr) => {
      const level = parseFloat(container.dataset["level"] || "0");
      while (lvstack[level] === undefined) {
        lvstack.push(0);
      }
      while (level < lvstack.length - 1) {
        lvstack.pop();
      }
      lvstack[level]++;
      container.dataset["value"] = lvstack[level] + "";
      // this.updateLi(container, null, ind, lvstack[level]);
    });
  }

  indent(context: RangedBlockEventContext, add: boolean = true) {
    const { page, block, range } = context;
    const typedblock = block as List;
    const indexs = [];
    const startIndex = block.findEditableIndex(range.startContainer);
    if (range.collapsed) {
      indexs.push(startIndex);
    } else {
      const endIndex = block.findEditableIndex(range.endContainer);
      for (let i = startIndex; i <= endIndex; i++) {
        indexs.push(i);
      }
    }

    const command = new ListDentCommand({
      page,
      block: typedblock,
      indexs,
      bias: add ? 1 : -1,
    });

    page.executeCommand(command);
  }

  handleTabDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    this.indent(context, !e.shiftKey);
    return true;
  }

  public get ListBlockType(): new (init?: ListData) => any {
    return List;
  }
  getLevelOfContainer(container: HTMLLIElement) {
    return parseInt(container.dataset["level"] || "0");
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
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
          children: block.getFirstEditable().innerHTML,
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
              page.setLocation(block.getLocation(0, indexs[0])!, block);
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
              children: containers
                .slice(1)
                .map((item: HTMLElement) => item.innerHTML),
            }),
            where: "after",
          }).removeCallback();
        })
        .withLazyCommand(({ page, block }, { containers }) => {
          // backspace 对应的行
          return new BlockCreate({
            page,
            block,
            newBlock: new Paragraph({ children: containers[0].innerHTML }),
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
    return true;
  }

  updateView(context: BlockEventContext) {}

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
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
            page.setRange(
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
            page.setLocation(block.getLocation(start, index)!, block);
          });
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          if (innerHTML === undefined) {
            throw new Error("sanity check");
          }
          const todoFlagLoc = block.getLocation(1, index);
          const children = [innerHTML];
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
          // newLi.innerHTML = innerHTML;
          addMarkdownHint(newLi);
          const typedBlock = block as List;
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
              this.updateValue(context);
              if (hasFlag) {
                page.setLocation(block.getLocation(2, index + 1)!, block);
              } else {
                page.setLocation(block.getLocation(0, index + 1)!, block);
              }
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

    const globalStart = block.getGlobalBiasPair([
      range.startContainer,
      range.startOffset,
    ]);
    const globalEnd = block.getGlobalBiasPair([
      range.endContainer,
      range.endOffset,
    ]);

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
        }).onUndo(({ block, page }) => {
          // debugger;
          const startLoc = block.getLocation(...globalStart)!;
          const endLoc = block.getLocation(...globalEnd)!;
          const range = createRange(...startLoc, ...endLoc);

          page.setRange(range);
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
          page.setLocation(block.getLocation(0, endIndex)!, block);
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

  handleBeforeInput(
    e: TypedInputEvent,
    context: BlockEventContext
  ): boolean | void {
    const { block, page, range } = context;
    if (!range) {
      throw new NoRangeError();
    }

    // 检测是否跨 Container
    if (parentElementWithTag(range.commonAncestorContainer, "li", block.root)) {
      // [] 识别并插入
      // debugger;
      if (
        e.inputType === "insertText" &&
        range.collapsed &&
        range.startOffset == 1 &&
        block.getBias([range.startContainer, range.startOffset]) === 1 &&
        range.startContainer.textContent![0].match(/[[【]/) &&
        e.data!.match(/[】\]]/) &&
        !prevValidSibling(range.startContainer)
      ) {
        const plugin = page.getPlugin<InlineSupport>("inlinesupport");
        const manager = plugin.getInlineManager<Flag>("flag");
        const node = manager.create({
          first: "TODO",
          constrain: ["DONE", "TODO"],
        });
        const index = block.findEditableIndex(range.startContainer);
        const command = new ListCommandBuilder({
          block,
          page,
          node,
          bias: 1,
          index,
        })
          .withLazyCommand(({ page, block, index }) => {
            return new TextDelete({
              page,
              block,
              start: 1,
              index,
              token_number: -1,
            });
          })
          .withLazyCommand(({ page, block, index, node }) => {
            return new NodeInsert({
              page,
              block,
              index,
              start: 0,
              node,
            }).onExecute(({ page }, { current }) => {
              page.setLocation(block.getLocation(2, index)!);
            });
          })
          .build();
        page.executeCommand(command);
        // 删除 [ 并插入 Flag
        return true;
      }

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
    const globalStart = block.getGlobalBiasPair([
      range.startContainer,
      range.startOffset,
    ]);
    const globalEnd = block.getGlobalBiasPair([
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
      })
        .onExecute(
          ({ areas }, { areas: _, op }: FormatMultipleText["buffer"]) => {
            let { block, offset } = areas[0];
            const startLoc = block.getLocation(offset.start, offset.index)!;
            block = areas[areas.length - 1].block;
            offset = areas[areas.length - 1].offset;

            let endLoc = block.getLocation(
              offset.end + (op === "removeFormat" ? -1 : 0),
              offset.index
            )!;
            if (!endLoc) {
              endLoc = block.getLocation(-1, offset.index)!;
            }

            page.setRange(createRange(...startLoc, ...endLoc));
          }
        )
        .onUndo(() => {
          const startLoc = block.getLocation(...globalStart)!;
          const endLoc = block.getLocation(...globalEnd)!;
          const range = createRange(...startLoc, ...endLoc);
          page.setRange(range);
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
            const startLoc = block.getLocation(...globalStart)!;
            const endLoc = block.getLocation(...globalEnd)!;
            const range = createRange(...startLoc, ...endLoc);
            page.setRange(range);
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
          const firstEditable = block.getEditable(offsets[0].index);
          const { index } = offsets[0];
          return new TextInsert({
            page,
            block,
            innerHTML: editable.innerHTML,
            start: getTokenSize(firstEditable),
            index,
          }).onExecute(({ block, start, index }) => {
            page.setLocation(block.getLocation(start, index)!, block);
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
        return true;
      }
    }
    if (command) {
      page.executeCommand(command);
    }

    return true;
  }

  handleCopy(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
}
