用来同步的在每个 Block 左侧添加一个可拖动的 | bar，使 Block 可以拖动

```
new Page({
    plugins: [
        new Dragable(),
        new FloatToolbar(),
    ],
    inlines: [
        MathEntry,
        EMEntry, // Float 可以用来更改 EM 的颜色属性
        ...
    ],
    blocks:[
        ParagraphEntry,
        ...
    ]

})
```

每一个 plugin 可以实现诸多接口：

```
onSendEvent()
onActivateBlock()
onDeActivateBlock()
onSelectionChange()
onSelectionEnd()

```
