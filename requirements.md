# Product requirements

## Goal

Build a game that trains Cyrillic letters for people who only know the Latin alphabet.

The game presents one Cyrillic letter at a time with five Latin options:

* one correct option
* four wrong options

The options are Latin letters or letter combinations that correspond to Cyrillic letters.

the ui language is english

letters are lowercase for now. perhaps later we expand

## Scoring

If the user selects the correct answer:

* increment `successCounter`

If the user selects a wrong answer:

* increment `failCounter`

After each answer:

* calculate the success ratio using % and 1 digit after the comma precision
* display `successCounter`, `failCounter`, success ratio, and round counter at the top
* persist scores in `localStorage`
* round counter is incremented with the start of new words, so first round is 1

## Rounds

The game consists of rounds.

At the start of each round:

* choose a random word from the dictionary

For each Cyrillic letter in the word:

* ask the user what the Cyrillic letter is in Latin
* show five clickable option buttons with values of latin letter/letters
* if the user selects a wrong answer, show the correct choice so the player learns
* if the user selects the correct answer, show that it was correct
* the color of the button is red or green. red if wrong. green if correct. if the button turns red, then also make the correct choice green.
* add an "next" button for the next letter to guess the translation for

When all letters in a word have been processed:

* show the whole word in Cyrillic
* show the Latin spelling
* show the English translation
* show a continue button

When the continue button is pressed:

* start a new round

## Data Model

The game uses a dictionary of the top 250 most common Bulgarian words.

Each dictionary entry contains:

* Cyrillic spelling
* Latin spelling
* English translation

Examples:

* `ж` has the Latin spelling `zh`
* `щ` has the Latin spelling `sht`

## Option Selection

If a Cyrillic letter translates to several Latin letters, that letter combination is one available option.

Wrong choices are selected randomly from a list of letters and letter combinations.

The option list consists of:

* all possible Cyrillic-to-Latin letter combinations
* all Latin letters `a` through `z`

For example, `zh` is a letter option because it is used when translating `ж`.



# gui

```
 corect:  2     wrong: 55    ratio: 0.4%    
 
             +------------+
             |            |
             |     3      |
             |            |
             +------------+

    +---+  +---+  +---+  +---+  +---+   
    | s |  | k |  | l |  | n |  | p |
    +---+  +---+  +---+  +---+  +---+ 

              | next |
 
 
 round: 22     seed: 1234

```

 
