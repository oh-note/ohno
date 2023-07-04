# Card

Card 可以看成是一个轻量级的 Page，Card 应该可以正常操作，并可以被关闭

问题在，哪些行为可以在 Page 中唤出一个 Card

如何做好 Shadow，WriteBack 行为？

当 Block Update 事件发生时，传递到打开 Card 的 plugin 上，该 plugin 随后需要分析该 Page 是否在当前页面存在，如果存在则实时更新
