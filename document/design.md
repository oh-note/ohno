# 细粒度的 inline content 的三种表达方法（json、html、markdown）

普通富文本，包括加粗、链接、plain text、行内代码等，仅包含 html tag，该tag 的部分属性的元素，可以简单的使用 CommonSerializer 进行序列化，这部分不多，可以穷举。

 - 对 Markdown 格式，穷举 toMarkdown 方法
 - 对 html，简单的 innerHTML 即可
 - 对 json，需要递归执行解析，因为加粗中可能存在 Inline Block


对 Inline Block 部分，这部分无法穷举，需要定义一个统一的接口，并规范数据形式。




```
[
    "str",
    undefined, null,
    {"type": "#text", text: "plain"},
    {"type": "bold", children: ["type":"#text", text:"bold"]},
    {"type": "label", inline_type: "xxx", data: {...} },
]
```