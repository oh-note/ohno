# Is there a way selecting MULTIPLE areas of text with JS in Chrome and/or IE?

No. Of the major browsers, only Firefox supports multiple ranges within the user selection. Other browsers (WebKit, Opera, IE9) do have the Selection API to support multiple ranges but do not currently support it. WebKit is apparently not planning to add support any time soon. As to Opera and IE, I have no idea.

> https://stackoverflow.com/questions/4985284/is-there-a-way-selecting-multiple-areas-of-text-with-js-in-chrome-and-or-ie
