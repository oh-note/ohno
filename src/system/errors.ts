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
