# Agent instructions

## Ownership

This file owns implementation guidance: file layout, script order, technology choices, code organization, design constraints, and coding style.
Keep this file detailed enough that the project structure can be recreated from the markdown files.
Do not put product rules, game rules, dataset contents, scoring rules, URL behavior, or UI behavior details here; those belong in `requirements.md`.

## Implementation Stack

Build the program as completely static HTML and JavaScript files.

Use a simple JavaScript stack with:

* HTML
* JavaScript
* Bootstrap
* jQuery

For simple progress histograms, use HTML and CSS. Do not add Chart.js or another charting package unless the requirements explicitly ask for richer chart interactions.

Do not introduce a build step unless the user explicitly asks for one.

## Code Organization

Keep the static app split into small files. Do not put the whole game in one large file.

Keep functions at a practical size. Do not extract tiny one-line or one-use helper functions unless the name captures an important domain rule or the extraction makes a complex block easier to read. Prefer direct code for simple local checks.

In all JavaScript files, use comments sparingly. Comments should explain non-obvious rules or tradeoffs, not restate function names or list the single call site of a function.

Use domain classes for cohesive app state instead of spreading many mutable fields through `game.js`.
`UserProgressStats` owns learning progress, `GameState` owns game-flow progress, and `CurrentWordState` owns runtime progress inside the active word round.
Use a plain `gameContext` object in `game.js` for URL-selected page-load context such as seed, dataset, game mode, and selected dataset.

Use this file layout:

* `index.html`: front-page HTML structure only. Contains the logo, dataset selector, game-mode direction selector, game input, start button, and credit footer.
* `game.html`: game-screen HTML structure only. Contains the score line with round counter, letter card, answer buttons, round-done view, game-over view, bottom new-game line, and credit footer.
* `base.css`: shared mobile-first base layout, theme variables, typography, shell sizing, and credit footer.
* `frontPage.css`: front-page-only layout and controls.
* `game.css`: game-screen-only layout and controls.
* `data.js`: data only. The exact data requirements are defined in `requirements.md`.
* `random.js`: deterministic random helper functions used by the game. Contains seeded random, choose, and seeded shuffle logic only.
* `urlSettings.js`: URL parameter normalization and navigation. Contains `game`, `data`, `gameMode`, new-game seed creation, and legacy `seed` URL handling.
* `userProgressStats.js`: user progress class. The exact class requirements are defined in `requirements.md`.
* `gameState.js`: game-flow state class. The exact class requirements are defined in `requirements.md`.
* `currentWordState.js`: active word-round runtime state class. The exact class requirements are defined in `requirements.md`.
* `trainingLetters.js`: stateless trainable-letter rules. Filters Cyrillic letters, derives case variants, and chooses the exact case variant to ask.
* `wordScheduler.js`: stateless word scheduling. Creates the seeded word order and advances `GameState.wordCursor` to the next askable word.
* `questionFactory.js`: stateless question construction. Builds prompts, correct answers, and answer options from game mode, transliteration data, and seeded random.
* `storage.js`: `localStorage` load/save handling only. It loads and saves `UserProgressStats` and `GameState`; the exact persistence requirements are defined in `requirements.md`.
* `game.js`: game controller. Starts rounds, chooses words, moves through letters, delegates question construction, handles answers, and handles next.
* `ui.js`: DOM rendering and DOM event binding. Renders the front page, score, letter guess view, button colors, bottom line, and round-done view.
* `app.js`: small bootstrap file that initializes the modules in the correct order.

Load local game-page scripts in this order:

```html
<script src="data.js"></script>
<script src="random.js"></script>
<script src="urlSettings.js"></script>
<script src="userProgressStats.js"></script>
<script src="gameState.js"></script>
<script src="currentWordState.js"></script>
<script src="trainingLetters.js"></script>
<script src="wordScheduler.js"></script>
<script src="questionFactory.js"></script>
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
