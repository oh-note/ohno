export function findCharBeforePosition(
  str: string,
  char: string,
  position: number
): number {
  const subStr = str.substring(0, position); // 截取从头到指定位置的子字符串
  return subStr.lastIndexOf(char); // 查询子字符串中是否存在指定字符
}

export function findCharAfterPosition(
  str: string,
  char: string,
  position: number
): number {
  const subStr = str.substring(position);
  return subStr.indexOf(char);
}
