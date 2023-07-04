import {
  OhNoClipboardData,
  RangedBlockEventContext,
} from "@ohno-editor/core/system";

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
    clipboardData.setData("text/ohno", json);
    // 选中部分文本情况下，有 inline serializer 进行序列化
  }
}
