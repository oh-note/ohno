export interface Record {
  op: string;
  payload?: any;
}

export function apply() {}

export function reverse(record: Record): Record {
  throw EvalError();
}
