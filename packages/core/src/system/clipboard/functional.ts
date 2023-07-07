import {
  MultiBlockEventContext,
  OhNoClipboardData,
  RangedBlockEventContext,
} from "../types";

export class ClipboardTransfer {
  data: { [key: string]: any } = {};
  setData(format: string, data: string) {
    this.data[format] = data;
  }
  writeToClipboard() {
    const clipboardItem = new ClipboardItem(this.data);
    navigator.clipboard
      .write([clipboardItem])
      .then(() => {})
      .finally(() => {});
  }
}

export function copyInBlock(
  clipboardData: DataTransfer,
  context: RangedBlockEventContext
) {
  const { page, block, range } = context;

  const ser = page.getBlockSerializer(block.type);

  if (range.collapsed) {
    // 非选中（collapsed）状态下，复制整个 block
    const text = ser.toMarkdown(block);
    const html = ser.toHTML(block);
    clipboardData.setData("text/plain", text);
    clipboardData.setData("text/html", html);

    const ohnoData: OhNoClipboardData = {
      data: [ser.toJson(block)],
    };
    const json = JSON.stringify(ohnoData);
    clipboardData.setData("text/ohno", json);
  } else {
    const text = ser.serializePart(block, range, "markdown");
    clipboardData.setData("text/plain", text);

    const html = ser.serializePart(block, range, "html");
    clipboardData.setData("text/html", html);

    const ohnoData: OhNoClipboardData = {
      data: [ser.serializePart(block, range, "json")],
    };
    const json = JSON.stringify(ohnoData);
    ohnoData.data[0].head = true;
    ohnoData.data[0].tail = true;
    clipboardData.setData("text/ohno", json);
    // 选中部分文本情况下，有 inline serializer 进行序列化
  }
}

export function copyMultiBlock(
  clipboardData: DataTransfer,
  context: MultiBlockEventContext
) {
  const { page, blocks, range } = context;
  const data = blocks.map((curBlock) => {
    let text, html, json;

    const blockser = page.getBlockSerializer(curBlock.type);
    if (curBlock.selection.isNodeInRange(curBlock.root, range)) {
      text = blockser.serialize(curBlock, "markdown");
      html = blockser.serialize(curBlock, "html");
      json = blockser.serialize(curBlock, "json");
    } else {
      text = blockser.serializePart(curBlock, range, "markdown");
      html = blockser.serializePart(curBlock, range, "html");
      json = blockser.serializePart(curBlock, range, "json");
    }

    return { text: text, html: html, json: json };
  });
  const markdown = data.map((item) => item.text).join("\n");
  const html = data.map((item) => item.html).join("");
  const json: OhNoClipboardData = {
    data: data.map((item) => item.json),
  };
  json.data[0].head = true;
  json.data[json.data.length - 1].tail = true;
  clipboardData.setData("text/plain", markdown);
  clipboardData.setData("text/html", html);
  clipboardData.setData("text/ohno", JSON.stringify(json));
}
