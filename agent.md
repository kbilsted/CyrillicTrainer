# Agent instructions

## Implementation Stack

Build the program as completely static HTML and JavaScript files.

Use a simple JavaScript stack with:

* HTML
* JavaScript
* Bootstrap
* jQuery

Do not introduce a build step unless the user explicitly asks for one.

## Code Organization

Keep the static app split into small files. Do not put the whole game in one large file.

Keep functions at a practical size. Do not extract tiny one-line or one-use helper functions unless the name captures an important domain rule or the extraction makes a complex block easier to read. Prefer direct code for simple local checks.

In all JavaScript files, use comments sparingly. Comments should explain non-obvious rules or tradeoffs, not restate function names or list the single call site of a function.

Use this file layout:

* `index.html`: HTML structure only. Contains the score line, letter card, answer buttons, round-done view, and bottom line. Loads Bootstrap, jQuery, and local JavaScript files.
* `styles.css`: mobile-first layout and visual styling for the top line, centered letter card, button row, feedback states, and round-done view.
* `data.js`: data only. The exact data requirements are defined in `requirements.md`.
* `random.js`: URL and random helper functions used by the game.
* `storage.js`: `localStorage` handling for `successCounter`, `failCounter`, `roundCounter`, and success ratio.
* `game.js`: game state and rules. Starts rounds, chooses words, moves through letters, chooses answer options, handles answers, and handles next.
* `ui.js`: DOM rendering and DOM event binding. Renders score, letter guess view, button colors, bottom line, and round-done view.
* `app.js`: small bootstrap file that initializes the modules in the correct order.

Load local scripts in this order:

```html
<script src="data.js"></script>
<script src="random.js"></script>
<script src="storage.js"></script>
<script src="ui.js"></script>
<script src="game.js"></script>
<script src="app.js"></script>
```

## Design Constraints

Design mobile first.

Assume a narrow viewport width by default.

## Typography

Use fonts where lowercase `l` and `i` are easy to read, and uppercase `I` is easy to distinguish from lowercase `l`.
Avoid fonts where lowercase `l` renders as a plain vertical line.

Prefer this font stack unless there is a strong reason to change it:

```css
"Cascadia Mono", Consolas, "Lucida Console", monospace
```

Do not use these font stacks:

```css
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Verdana, Tahoma, Geneva, sans-serif
```

## Requirements Source

Requirement details live only in `requirements.md`.
Do not duplicate them in this agent instruction file.
