# day7: 开发过程中的其他 bug 汇总

编辑器的开发十分注重细节，一个条件考虑不到位就有可能导致最终的行为和预期出现偏差，本篇总结了开发过程中遇到的诸多细节 bug，仅供参考。

## 因为 Markdown-hint 导致的 bug

在 ohno 中，Markdown-hint 的实现是通过在富文本标记的开始和结束添加两个 span：

```html
<b><span class="oh-hint">**</span>456<span class="oh-hint">**</span></b>
```

带有 `oh-hint` className 的 span 都会在 ohno 的光标移动和位置获取中被忽略或跳过。因为额外的判断，这种实现方式带来了很多 bug，包括：

### 鼠标点击的位置与预期不符

鼠标移动光标时，会使光标移动到使用键盘不可能出现的位置。比如在点击 hint 时，默认的光标位置会位于 span->text，导致光标的位置视觉上一致，但是底层代码的判定会混乱。光标可能还会出现在边界 span 和富文本的边界处，如：`<b>...<span class="oh-hint">**</span>|</b>`。这一行为需要可以在 MouseUp 事件中通过修正 range 来解决。

### 边界位置编辑时插入位置出错

在光标移动时，所有的 span 都会做

## Composition

### 与功能键冲突

### Hint 键
