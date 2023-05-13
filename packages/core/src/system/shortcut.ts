type Alphabet =
  | "q"
  | "w"
  | "e"
  | "r"
  | "t"
  | "y"
  | "u"
  | "i"
  | "o"
  | "p"
  | "a"
  | "s"
  | "d"
  | "f"
  | "g"
  | "h"
  | "j"
  | "k"
  | "l"
  | "z"
  | "x"
  | "c"
  | "v"
  | "b"
  | "n"
  | "m";

type Arrow = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
type Meta = "Ctrl" | "Meta" | "Alt" | "Shift";
type Punc =
  | ","
  | "."
  | "/"
  | "<"
  | ">"
  | "?"
  | ";"
  | "'"
  | "["
  | "]"
  | "-"
  | "="
  | ":"
  | '"'
  | "`"
  | "!"
  | "@"
  | "#"
  | "$"
  | "%"
  | "^"
  | "&"
  | "*"
  | "("
  | ")"
  | "_"
  | "+";
type NumberStr = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "0";
type KeyString = Alphabet | NumberStr | Arrow | Meta | Punc;

export interface IShortcut {
  registKey(namespace: string, key: string,): void;
  matchString(e: KeyboardEvent, ...keys: KeyString[]): boolean;
  searilizeKey(e: KeyboardEvent): Set<KeyString>;
  match(e: KeyboardEvent, name: string): boolean;
  match(e: KeyboardEvent): string | null;
}

export class ShortCut {}

const defaultShortcut = new ShortCut();
