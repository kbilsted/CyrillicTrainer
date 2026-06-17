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

Use this file layout:

* `index.html`: HTML structure only. Contains the score line, letter card, answer buttons, round-done view, and bottom line. Loads Bootstrap, jQuery, and local JavaScript files.
* `styles.css`: mobile-first layout and visual styling for the top line, centered letter card, button row, feedback states, and round-done view.
* `data.js`: data only. Contains `LETTER_TRANSLITERATIONS`, explicit `LETTER_OPTIONS`, and explicit `WORD_SOURCE` entries with `cyrillic`, `latin`, and `englishmeaning`.
* `random.js`: seed handling and random helpers. Reads or creates `?seed=1234`, provides seeded random for word and wrong-answer choices, and non-seeded random for correct-answer position.
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

## Randomness

The game must be repeatable but also changing.

Use a seed from the URL:

```text
?seed=1234
```

Use the seed for all random number operations.

If no seed is found in the URL:

* randomize a seed
* redirect to the same page with the seed added to the URL

the seed determines
* the order in which words are chosen for rounds
* the choices of latin letter translation
* the position of the correct choice for a letter translation is  not  repeatable from the seed 


## Dataset 1. top 250 words

Generate the dictionary and letter list in a separate JavaScript file, data.js, that is imported by the game.

The AI should provide the lists. the AI should check all words and translations with no mistakes since this is the whole game.

the list WORD_SOURCE should be explicit with fields "cyrillic", "latin", "englishmeaning". so we clearly see the translation for each word from cyrilic to latin. 

the ai must ensure the list of words contain at least 1 instance of each cyrilic character otherwise we are missing out on the training which is the goal of the game. if we are missing letters, replace the last words (most infrequent) with words such that all letters are represented. 


### dataset 2. Hiking words 
we want a separate dataset for hiking relevant stuff. Words in this list are

* "train", "bus", "delay", "emergency", "thunder", "bad weather", "feet", "tired", "well rested", "fresh", "water", "mountain", "trail", "snake", "sheep dog", "horse", "mountain peak"
* all tje hut names on kom-emine e3, e.g. vezhen hut, eho hut, ... (ai must generate this list from online)

the datasets can be changed using the url ?data=1 or ?data=2 and if not found redirect the url so it contains the ?data also the ui should have a dropdown at the bottom next to the seed, 
the dropdown has options "top 250 words" and "hiking words"