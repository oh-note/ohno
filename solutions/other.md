### 数据层建模（序列化）

对数据层的建模，可以看做是序列化的过程，通过递归或者堆栈都可以比较方便的实现，以递归方式为例：

```ts
export interface Segment {
  value: string;
  format: HTMLElementTagName[];
}
export function serializeNode(
  el: Node,
  context?: HTMLElementTagName[]
): Segment[] {
  const res: Segment[] = [];
  context = context || [];
  if (isTextNode(el)) {
    res.push({ format: context, value: el.textContent! });
  } else if (isHTMLElement(el)) {
    if (el.childNodes.length === 0) {
      res.push({
        value: "",
        format: context?.slice().concat(getTagName(el) as HTMLElementTagName),
      });
    }

    el.childNodes.forEach((item) => {
      res.push(
        ...serializeNode(
          item,
          context?.slice().concat(getTagName(el) as HTMLElementTagName)
        )
      );
    });
  }

  return res;
}

export function serialize(...el: Node[]): Segment[] {
  const res: Segment[] = [];
  el.forEach((item) => {
    res.push(...serializeNode(item));
  });
  return res;
}
```

可以通过测试检测 `serialize()` 的有效性

```ts
describe("test serializer", () => {
  test("default", () => {
    const p = createElement("p");
    p.innerHTML = "000<i>123<b>456</b>789</i>";
    res = serialize(p);
    expect(res.length).toBe(4);
    expect(res[0]).toStrictEqual({ value: "000", format: ["p"] });
    expect(res[1]).toStrictEqual({ value: "123", format: ["p", "i"] });
    expect(res[2]).toStrictEqual({ value: "456", format: ["p", "i", "b"] });
    expect(res[3]).toStrictEqual({ value: "789", format: ["p", "i"] });
  });
});
```

> Notion 的数据结构就是类似的方式

这种序列化方法缺少对每个元素的标识，从而无法保证反序列化结果唯一，下面是一个例子：

```ts
p.innerHTML = "<b><i>123</i>000<i>456</i></b>";
res = serialize(p);

expect(res).toStrictEqual([
  { format: ["p", "b", "i"], value: "123" },
  { format: ["p", "b"], value: "000" },
  { format: ["p", "b", "i"], value: "456" },
]);

p.innerHTML = "<b><i>123</i></b><b>000</b><b><i>456</i></b>";
res = serialize(p);
expect(res).toStrictEqual([
  { format: ["p", "b", "i"], value: "123" },
  { format: ["p", "b"], value: "000" },
  { format: ["p", "b", "i"], value: "456" },
]);
```

可以通过在渲染过程中递归的传入当前元素的深度序列信息来解决这一问题，Segment 的字段更新为：

```ts
export interface Segment {
  value: string;
  format: HTMLElementTagName[];
  index: number[];
}
```

添加 `index` 不需要 `serialize` 改动太多，代码略。

### 数据层渲染（反序列化）

反序列化这里假设不会有太深的层级（最多 6 层：`code+b+i+del+u+el`），简单实现如下：

```ts
export function deserialize(...seg: Segment[]): Node[] {
  const root = createElement("p");

  for (const { value, format, index } of seg) {
    let cur: HTMLElement = root;
    for (let i = 0; i < format.length; i++) {
      const ind = index[i];
      if (cur.childNodes[ind]) {
        cur = cur.childNodes[ind] as HTMLElement;
      } else {
        const child = createElement(format[i]);
        cur.appendChild(child);
        cur = child;
      }
    }
    cur.appendChild(createTextNode(value));
  }

  return Array.from(root.childNodes);
}
```

通过测试可以证明这种方式可以在 Segment 和 HTMLElement 之间建立唯一的映射（序列化和反序列化）关系。

```ts
p.innerHTML = "<b><i>123</i>000<i>456</i></b>";
res = serialize(p);
expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);

p.innerHTML = "<b><i>123</i></b><b>000</b><b><i>456</i></b>";
res = serialize(p);
expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);
```

### 对行内块的序列化和反序列化

对公式等特殊的行内块元素，需要定制化的序列化反序列化方法，也需要一个统一的接口来处理。对此，约定所有行内块元素外由 label 包裹，并设置 `value` 和 `serializer` 属性，所有行内块元素需要以相应的 `serializer` 名称在 ohno 内部注册序列化和反序列化方法。这部分实现不涉及主要系统设计，略。
