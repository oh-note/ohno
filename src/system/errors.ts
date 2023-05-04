// 定义一些常用的 Error，Error 应该尽量不引入其他文件，保证可以全局使用不用引用
class NoRangeError extends Error {
  constructor(msg: string = "Missing range which is nessary.") {
    super(msg);
  }
}

class EditableNotFound extends Error {
  constructor(tgt?: Node, order?: string) {
    const msg = `Missing editable container in block ${order} with location ${tgt}`;
    console.error(tgt);
    super(msg);
  }
}
