export function getSoftLineHead(
  root: HTMLElement,
  container: Node,
  offset: number
): [Node, number] {
  // 如果当前容器是根元素，则直接返回根元素和偏移量
  if (container === root) {
    return [container, offset];
  }

  // 获取容器的上一个兄弟元素
  const prevSibling = container.previousSibling;

  // 如果没有上一个兄弟元素，说明当前容器是父元素的第一个子元素，需要递归向上查找
  if (!prevSibling) {
    return getSoftLineHead(
      root,
      container.parentNode,
      Array.from(container.parentNode.childNodes).indexOf(container)
    );
  }

  // 计算当前容器的位置
  const containerRect = container.getBoundingClientRect();
  const prevSiblingRect = prevSibling.getBoundingClientRect();

  // 判断当前容器是否跨行
  const isCrossLine =
    containerRect.top > prevSiblingRect.bottom ||
    containerRect.bottom < prevSiblingRect.top;

  // 如果跨行，则返回当前容器和偏移量
  if (isCrossLine) {
    return [container, offset];
  }

  // 如果没有跨行，递归查找前一个兄弟元素
  return getSoftLineHead(root, prevSibling, prevSibling.textContent.length);
}
