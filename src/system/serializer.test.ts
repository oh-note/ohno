import { describe, expect, test } from "vitest";
import { createElement, innerHTMLToNodeList } from "../helper/document";
import { Segment, deserialize, serialize } from "./serializer";
import { innerHTML } from "../helper/element";

describe("test tokenizer", () => {
  test("format and deformat", () => {
    const p = createElement("p");
    p.innerHTML = "<i>123</i><i>456</i>";
    const segs = serialize(...Array.from(p.childNodes));
    segs.map((item) => {
      item.format.unshift("b");
      item.index.unshift(0);
    });
    let wraped = deserialize(...segs);
    let tgt = "<b>" + p.innerHTML + "</b>";
    expect(innerHTML(...wraped)).toBe(tgt);
    segs.map((item) => {
      item.format.shift();
      item.index.shift();
    });
    wraped = deserialize(...segs);
    expect(innerHTML(...wraped)).toBe(p.innerHTML);
  });

  test("deserializer", () => {
    const p = createElement("p");
    let res;
    p.innerHTML = "<i>123</i><i>456</i>";
    res = serialize(p);
    expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);

    p.innerHTML = "<b><i>123</i>000<i>456</i></b>";
    res = serialize(p);
    expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);

    p.innerHTML = "<b><i>123</i></b><b>000</b><b><i>456</i></b>";
    res = serialize(p);
    expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);
  });

  test("neighbor", () => {
    const p = createElement("p");
    p.innerHTML = "<i>123</i><i>456</i>";
    let res;
    res = serialize(p);
    expect(res).toStrictEqual([
      { format: ["p", "i"], value: "123", index: [0, 0, 0] },
      { format: ["p", "i"], value: "456", index: [0, 1, 0] },
    ] as Segment[]);

    p.innerHTML = "<b><i>123</i>000<i>456</i></b>";
    res = serialize(p);

    expect(res).toStrictEqual([
      { format: ["p", "b", "i"], value: "123", index: [0, 0, 0, 0] },
      { format: ["p", "b"], value: "000", index: [0, 0, 1] },
      { format: ["p", "b", "i"], value: "456", index: [0, 0, 2, 0] },
    ] as Segment[]);

    p.innerHTML = "<b><i>123</i></b><b>000</b><b><i>456</i></b>";
    res = serialize(p);
    expect(res).toStrictEqual([
      { format: ["p", "b", "i"], value: "123", index: [0, 0, 0, 0] },
      { format: ["p", "b"], value: "000", index: [0, 1, 0] },
      { format: ["p", "b", "i"], value: "456", index: [0, 2, 0, 0] },
    ] as Segment[]);
  });

  test("default", () => {
    const p = createElement("p");
    let res;
    res = serialize(p);
    expect(res.length).toBe(1);
    p.innerHTML = "123";
    res = serialize(p);

    expect(res.length).toBe(1);

    expect(res[0]).toStrictEqual({
      format: ["p"],
      value: "123",
      index: [0, 0],
    } as Segment);
    p.innerHTML = "<b></b>";
    res = serialize(p);
    expect(res.length).toBe(1);

    expect(res[0]).toStrictEqual({
      value: "",
      format: ["p", "b"],
      index: [0, 0],
    } as Segment);

    p.innerHTML = "000<i>123<b>456</b>789</i>";
    res = serialize(p);
    expect(res.length).toBe(4);
    expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);
  });
});
