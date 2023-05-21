# ohno... Another block-style, markdown suppoted, rich editor

ohno is a rich text editor designed from the bottom up, aiming to achieve minimal bugs and maximum scalability with the simplest code possible, while providing a friendly and customizable user editing experience.


## Why yet another OPEN SOURCED editor

There are many open-source rich editors available. However, even after trying them out, I am still unsatisfied with the editing experience provided by existing solutions, which can be summarized in the following points:

- Complex initialization behavior: Whether based on contenteditable or a custom rendering framework, there tends to be a significant amount of context generated behind the scenes during `page.render(el)`. Additionally, when using UI frameworks like React or Vue, these editors may trigger unnecessary re-renders.
- Uncertain editing results: Any operation in the editor should yield a clear and consistent result. It is crucial to avoid situations where the same action produces different outcomes due to faulty code logic, especially regarding the history functionality. Most editors have issues with their history feature.
- Unfriendly editing experience: The majority of editors only provide basic rich text editing functionality and lack the modern and more user-friendly experience offered by Markdown-style editing.

ohno was designed from the beginning with a commitment to addressing these issues, and due to the effectiveness of its underlying design, the Minimum Viable Product (MVP) was created after only two months of part-time development.

## What features does Ohno provide?

For users:
- Markdown-style editing experience
- Reliable editing results
- Optimized user experience

For developers:
- Clear architectural design
- Near-linear scalability in complexity
- Rich component examples


## Talk is cheap, show me the EDITOR