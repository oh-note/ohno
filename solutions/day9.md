# wrapper

wrapper 是一个介于 Page 和 Block 之间的概念

既不像 Page 维护所有的 Block，也不像 Block 内部有可编辑元素
可以看成是 Page 内部的 Block 的管理器
可以理解成，最轻量的 Wrapper 就是 Block 的 root

这样可以新增一条链条，除了原来有的 Block chain 之外，再额外的加一个多重链表，每条链表表示一个 Wrapper 管理的 Block

Wrapper 可以提供的作用：

- 可以折叠，比如一个 Headings 下的普通文本都属于一个 Wrapper（通过插件实现）
- Wrapper 可以互相嵌套，比如 H1-H5，可以互相嵌套
- Wrapper 可以横向，用来实现多列
- 可以用来构建子窗口？
- 。。。
- Blockquote Wrapper？
- Table cell 内建立一个 wrapper？
- 
