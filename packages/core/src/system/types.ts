// https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
interface TypedInputEvent extends InputEvent {
  readonly data: string | null;
  readonly dataTransfer: DataTransfer | null;
  readonly inputType: InputType;
  readonly isComposing: boolean;
  getTargetRanges(): StaticRange[];
}

type InputType =
  | "insertText"
  | "insertReplacementText"
  | "insertLineBreak"
  | "insertParagraph"
  | "insertOrderedList"
  | "insertUnorderedList"
  | "insertHorizontalRule"
  | "insertFromYank"
  | "insertFromDrop"
  | "insertFromPaste"
  | "insertFromPasteAsQuotation"
  | "insertTranspose"
  | "insertCompositionText"
  | "insertLink"
  | "deleteWordBackward"
  | "deleteWordForward"
  | "deleteSoftLineBackward"
  | "deleteSoftLineForward"
  | "deleteEntireSoftLine"
  | "deleteHardLineBackward"
  | "deleteHardLineForward"
  | "deleteByDrag"
  | "deleteByCut"
  | "deleteContent"
  | "deleteContentBackward"
  | "deleteContentForward"
  | "historyUndo"
  | "historyRedo"
  | "formatBold"
  | "formatItalic"
  | "formatUnderline"
  | "formatStrikeThrough"
  | "formatSuperscript"
  | "formatSubscript"
  | "formatJustifyFull"
  | "formatJustifyCenter"
  | "formatJustifyRight"
  | "formatJustifyLeft"
  | "formatIndent"
  | "formatOutdent"
  | "formatRemove"
  | "formatSetBlockTextDirection"
  | "formatSetInlineTextDirection"
  | "formatBackColor"
  | "formatFontColor"
  | "formatFontName";

type Style = {
  [key in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[keyof CSSStyleDeclaration];
};

type ColorKeyword = "red" | "blue" | "green" | "yellow" | "black" | "white";
type HexColor = string; // 例如 '#ff0000'
type RgbColor = [number, number, number]; // 例如 [255, 0, 0]
type RgbaColor = [number, number, number, number]; // 例如 [255, 0, 0, 0.5]
type HslColor = [number, string, string]; // 例如 [0, '100%', '50%']
type HslaColor = [number, string, string, number]; // 例如 [0, '100%', '50%', 0.5]
type Color =
  | RgbColor
  | ColorKeyword
  | HexColor
  | RgbaColor
  | HslColor
  | HslaColor;
