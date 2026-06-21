# Product requirements

This is the single authoritative file for product and dataset requirements.
Do not duplicate dataset requirements in `agent.md` or other files.

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

* calculate the success ratio using % and 1 digit after the dot (precision)
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
* add an "next" button for the next letter to guess the translation for. the button is automatically clicked after 2 seconds in case user answered correctly.

The game stores the last 10 Cyrillic letters that were answered correctly in `localStorage`.
If the next Cyrillic letter has already been answered correctly within the last 10 remembered letters, skip it and go to the next Cyrillic letter.
Letters answered incorrectly are not remembered for this skip rule.

When all letters in a word have been processed:

* show the whole word in Cyrillic
* show the Latin spelling
* show the English translation
* show a next button

When the next  button is pressed:

* start a new round

## Data Model

The game has three datasets.

The dictionary and letter lists must be generated in `data.js`, which is imported by the game.

The AI must provide the lists and verify the Bulgarian words, Latin spellings, and English meanings carefully because the dataset is core to the game.

Each dictionary entry contains:

* Cyrillic spelling
* Latin spelling
* English translation

Each dictionary entry in JavaScript uses explicit fields:

* `cyrillic`
* `latin`
* `englishmeaning`

Examples:

* `ж` has the Latin spelling `zh`
* `щ` has the Latin spelling `sht`

### Dataset 1: top 250 words

Dataset 1 contains the top 250 most common Bulgarian words.

Dataset 1 must contain at least one instance of every lowercase Bulgarian Cyrillic character used by the trainer. If the top 250 source words do not cover every character, replace the last and least frequent words with words that add the missing characters.

Use this dataset when the URL contains:

```text
?data=1
```

### Dataset 2: hiking words

Dataset 2 contains hiking-relevant Bulgarian words.

It includes:

* words such as train, bus, delay, emergency, thunder, bad weather, feet, tired, well rested, fresh, water, mountain, trail, snake, sheep dog, horse, and mountain peak
* all hut and shelter names on Kom-Emine E3, such as Vezhen hut, Eho hut, and the rest of the route huts

The AI must generate the Kom-Emine E3 hut and shelter list from online sources.

Use this dataset when the URL contains:

```text
?data=2
```

### Dataset 3: alphabet letters

Dataset 3 contains all lowercase Bulgarian Cyrillic alphabet letters.

Each dictionary entry is one Cyrillic letter with its Latin spelling.

Use this dataset when the URL contains:

```text
?data=3
```

If `data` is missing from the URL, redirect to the same page with `data=1`.

The UI must have a dataset dropdown at the bottom next to the seed.

The dropdown options are:

* `top 250 words`
* `hiking words`
* `alphabet letters`

## Option Selection

If a Cyrillic letter translates to several Latin letters, that letter combination is one available option.

Wrong choices are selected randomly from a list of letters and letter combinations.

The option list consists of:

* all possible Cyrillic-to-Latin letter combinations
* all Latin letters `a` through `z`

For example, `zh` is a letter option because it is used when translating `ж`.



# gui

## gui for letter guess 

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
             +------------+
             |            |
             |     з      |
             |            |
             +------------+

    +---+  +---+  +---+  +---+  +---+   
    | s |  | k |  | l |  | n |  | p |
    +---+  +---+  +---+  +---+  +---+ 

              | next |
 
 
 round: 22     seed: 1234     data: [top 250 words v]

```

## gui for round done 1

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
 
        ROUND DONE
        
     WORD: xxxxxx
     In Latin: | show |    
     Meaning: | show | 
         
             
          | next |
 
 
 round: 22     seed: 1234     data: [top 250 words v]

```

Both `show` buttons reveal both hidden fields: the Latin spelling and the English meaning.

### gui for round done - click done

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
 
        ROUND DONE
        
     WORD: xxxxxx
     In Latin: yyyyyy    
     Meaning: zz zz zz 
         
             
          | next |
 
 
 round: 22     seed: 1234     data: [top 250 words v]

```
