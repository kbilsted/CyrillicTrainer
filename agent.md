# Agent instructions

## Implementation Stack

Build the program as completely static HTML and JavaScript files.

Use a simple JavaScript stack with:

* HTML
* JavaScript
* Bootstrap
* jQuery

Do not introduce a build step unless the user explicitly asks for one.

## Design Constraints

Design mobile first.

Assume a narrow viewport width by default.

Avoid dropdowns.

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


## Data Generation

Generate the dictionary and letter list in a separate JavaScript file, data.js, that is imported by the game.

The AI should provide the lists. the AI should check all words and translations with no mistakes since this is the whole game.

the lists should be explicit and not computed so we can clearly read and check correctness. both word list and letterchoices

the ai must ensure the list of words contain at least 1 instance of each cyrilic character otherwise we are missing out on the training which is the goal of the game. if we are missing letters, replace the last words (most infrequent) with words such that all letters are represented. 