# React შიგნიდან — build your own React

An interactive lesson in Georgian (technical terms in English) that companions the
[Vanilla JS → React lecture deck](https://github.com/thothcher/react-intro-lecture).
Instead of describing React, students **build a small React from scratch**, chapter by chapter, and watch it run on
the same Trattoria restaurant app they know from the course.

The page itself is **plain vanilla JavaScript**: no React, no libraries, no build step. Double-click `index.html`.

## Chapters

| # | Chapter | What students do |
| --- | --- | --- |
| 00 | Cover | A live pipeline: JSX → `h()` → object → DOM, running on the library built in the lesson |
| 01 | The pain | The vanilla app re-renders with `innerHTML`: one "Add" costs ~120 DOM operations, focus is lost on every keystroke |
| 02 | JSX | Edit JSX; **our own JSX compiler** turns it into `h()` calls; `h()` returns plain objects (virtual DOM) |
| 03 | render | `createDom()` turns objects into DOM. The real `createElement` / `appendChild` calls are recorded and replayed step by step |
| 04 | state | `UI = f(state)` the naive way: rebuild everything. The tree view turns red — every node is new |
| 05 | reconciliation | `patch()` changes only the difference. Flip the engine **v0.4 ↔ v0.5** on the same app: 92 operations → 1 |
| 06 | hooks | `useState` = an array + a cursor. Inspect every component's hooks; batching (3 `setState` → 1 render); a switch puts a hook inside an `if` and the search box fills with the wrong state |
| 07 | key | Without keys children are matched by position — remove the first row and its "like" jumps to the neighbour. With `key={p.id}` instances follow their product; reversing only moves nodes |
| 08 | Result | The full app on our React, **editable** (Ctrl + Enter recompiles and remounts), download `mini-react.js`, and an honest list of what the real React adds |

## How it works

- Every piece of code shown on the page lives in a `<script type="text/x-source">` block in `index.html` and is
  **executed** by the labs (`new Function`). What students read is exactly what runs.
- `mini-react.js` grows from v0.2 to v0.7; `js/lib.js` assembles each version from those blocks, and the code panel
  shows each chapter's diff (+ added / − removed lines).
- The instruments never touch the library: a `MutationObserver` counts DOM operations and draws "highlight updates"
  flashes; the virtual-DOM tree and the hooks inspector read the root object the library already keeps.

```
index.html            page shell + all executable sources (vanilla app, mini-react blocks, JSX apps)
css/base.css          design tokens, layout, code panel, editor
css/lab.css           labs, instruments, the restaurant mini-app, cover
js/core.js            namespace, helpers, icons, demo data
js/highlight.js       small JS/JSX/HTML highlighter
js/jsx.js             JSX compiler (elements, components, attributes, spread, nested JSX, JSX whitespace rules)
js/diff.js            line diff for the code panel
js/editor.js          textarea-over-highlight code editor
js/lib.js             mini-react versions + compile()
js/instrument.js      DOM meter, update flashes, tree / hooks views, focus watcher
js/applab.js          compiles a JSX app, runs it on a chosen mini-react version, wires the instruments
js/chapters/*.js      one file per chapter
js/main.js            navigation, chapter layout, code panel
```

Keys: <kbd>←</kbd> <kbd>→</kbd> chapters (ignored while typing), <kbd>Home</kbd> / <kbd>End</kbd>,
<kbd>Ctrl</kbd> + <kbd>Enter</kbd> runs the editor in chapter 08. `#/5` opens a chapter directly.

## Credits

Fonts: FiraGO and JetBrains Mono (SIL Open Font License), bundled in `assets/fonts`.
