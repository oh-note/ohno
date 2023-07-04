# File structure

- history.ts: command module / undo-redo
- [ ] clipboard.ts: write to clipboard
- [ ] config.ts
- errors.ts: throwed errors, need to polish
- floatings.ts: functions about floating-ui
- format.ts: functions about enformat and deformat
- handler.ts: interface definations of event handler
- selection.ts: functions and class of selection for each block
- shortcut.ts: shortcut manager
- types.ts: commonly-used type definations
- [ ] wordSegment.ts: class and function about word segment
- [ ] page.ts: defination of Page
- inline.ts: inline block constrains

```
Page {
    declear {
        Inline
        Blocks
        Plugins
    }
    

}

Block {
    Editables

}
```
