export function findCharBefore(
  str: string,
  char: string,
  offset: number
): number {
  const subStr = str.substring(0, offset); // 截取从头到指定位置的子字符串
  return subStr.lastIndexOf(char); // 查询子字符串中是否存在指定字符
}

export function findCharAfter(
  str: string,
  char: string,
  offset: number
): number {
  const subStr = str.substring(offset);
  return subStr.indexOf(char);
}

export function createOrderString(prev: string = "", next: string = "") {
  let p = 0,
    n = 0,
    pos,
    str;
  for (pos = 0; p === n; pos++) {
    // find leftmost non-matching character
    p = pos < prev.length ? prev.charCodeAt(pos) : 96;
    n = pos < next.length ? next.charCodeAt(pos) : 123;
  }
  str = prev.slice(0, pos - 1); // copy identical part of string
  if (p === 96) {
    // prev string equals beginning of next
    while (n === 97) {
      // next character is 'a'
      n = pos < next.length ? next.charCodeAt(pos++) : 123; // get char from next
      str += "a"; // insert an 'a' to match the 'a'
    }
    if (n === 98) {
      // next character is 'b'
      str += "a"; // insert an 'a' to match the 'b'
      n = 123; // set to end of alphabet
    }
  } else if (p + 1 === n) {
    // found consecutive characters
    str += String.fromCharCode(p); // insert character from prev
    n = 123; // set to end of alphabet
    while ((p = pos < prev.length ? prev.charCodeAt(pos++) : 96) === 122) {
      // p='z'
      str += "z"; // insert 'z' to match 'z'
    }
  }
  return str + String.fromCharCode(Math.ceil((p + n) / 2)); // append middle character
}
