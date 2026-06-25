# Product requirements

This is the single authoritative file for product and dataset requirements.
Do not duplicate dataset requirements in `agent.md` or other files.

## Goal

Build a game that trains Cyrillic letters for people who only know the Latin alphabet.

The game has two game modes:

* `Cyrilic -> Latin`
* `Latin -> Cyrilic`

The title of the active game mode is shown above the large question card for each question.

In `Cyrilic -> Latin` mode, the game presents one Cyrillic letter at a time with six Latin options.

In `Latin -> Cyrilic` mode, the game presents one Latin letter or letter combination at a time with six Cyrillic options.
The Latin question values are derived by reading `LETTER_TRANSLITERATIONS` backwards.
For example, `sht` can be a Latin question and `щ` is the correct Cyrillic answer.
If several Cyrillic characters share the same Latin transliteration, the current word's exact Cyrillic character determines the correct answer.

For both modes, each question has:

* one correct option
* five wrong options

The options are Latin letters or letter combinations in `Cyrilic -> Latin` mode.
The options are Cyrillic letters in `Latin -> Cyrilic` mode.

the ui language is english

letters can be lowercase or uppercase Cyrillic.
When the shown Cyrillic letter is uppercase, all Latin answer options are uppercase too.

## Named Concepts

Use these names consistently for the core entities:

* `LETTER_TRANSLITERATIONS`: the authoritative Cyrillic-to-Latin transliteration table
* `gameMode`: the URL parameter and product concept for choosing translation direction
* `recentCorrectLetters`: the last 10 correctly answered exact Cyrillic characters
* `letterErrorCounts`: the persisted dictionary of exact Cyrillic character error counts

## Scoring

If the user selects the correct answer:

* increment `successCounter`

If the user selects a wrong answer:

* increment `failCounter`
* increment the error count for the exact Cyrillic character that was asked

After each answer:

* calculate the success ratio using % and 1 digit after the dot (precision)
* display `successCounter`, `failCounter`, success ratio, and round counter at the top
* persist scores in `localStorage`
* round counter is incremented with the start of new words, so first round is 1

The UI has a reset button.
When pressed, it clears `successCounter`, `failCounter`, `roundCounter`, the last 10 correctly answered Cyrillic letters, and the Cyrillic letter error counts from `localStorage`.
After reset, the game starts a fresh round.

The game stores a persisted dictionary of Cyrillic letter error counts in `localStorage`.
The dictionary maps each exact Cyrillic character to the number of wrong answers for that character:

* key: Cyrillic character
* value: `errorCount`

The error-count dictionary is case-sensitive.
Lowercase and uppercase Cyrillic characters are tracked separately.

## Rounds

The game consists of rounds.

At the start of each round:

* choose a random word from the dictionary
* prefer words that contain at least one Cyrillic letter variant that is not in the last 10 correctly answered letters
* do not exclude a word just because it also contains one or more letters from the last 10 correctly answered letters
* if every word would be fully skipped by the last-10 rule, choose from the full dictionary instead

For each Cyrillic letter in the word:

* if the Cyrillic letter is in the last 10 correctly answered letters, skip it and go to the next Cyrillic letter
* in `Cyrilic -> Latin` mode, ask the user what the Cyrillic letter is in Latin
* in `Latin -> Cyrilic` mode, show the Latin transliteration and ask the user which Cyrillic letter it represents
* show the active game mode title above the large question card
* show six clickable option buttons
* if the user selects a wrong answer, show the correct choice so the player learns
* if the user selects the correct answer, show that it was correct
* the color of the button is red or green. red if wrong. green if correct. if the button turns red, then also make the correct choice green.
* add an "next" button for the next letter to guess the translation for. the button is automatically clicked after 500 ms in case user answered correctly.

For each dataset, each trainable Cyrillic letter in a word creates one question, using either the lowercase or uppercase variant.
For example, the word letter `г` creates a question for either `г` or `Г`, not both.

The game stores the last 10 Cyrillic letters that were answered correctly in `localStorage`.
Letters answered incorrectly are not remembered for this skip rule.

The game keeps a runtime-only `lastWrongAnswer` value.
When the user answers incorrectly, set `lastWrongAnswer` to the exact Cyrillic character that was asked, including uppercase/lowercase.
When a round ends and `lastWrongAnswer` has a value, the next round must use it for word selection:

* choose a random word from the current round candidate words that contains the same Cyrillic letter, using case-insensitive matching
* if no candidate word contains that letter, choose a random word from the current round candidate words
* do not force a specific matching letter position or casing in that word
* set `lastWrongAnswer` to `null` after the next word has been selected

When `lastWrongAnswer` is `null`, choose a random word from the current round candidate words.

When all letters in a word have been processed:

* show the whole word in Cyrillic
* show the Latin spelling
* show the English translation
* show a `show progress` button
* show a next button

When the `show progress` button is pressed:

* show a histogram of all Cyrillic letters that have at least one error
* each histogram bar shows the Cyrillic letter and its `errorCount`
* sort bars left to right by highest `errorCount` first
* keep the histogram mobile-friendly when many letters have errors by allowing horizontal scrolling instead of shrinking bars until labels become unreadable
* if there are no errors, show an empty progress message

When the next  button is pressed:

* start a new round

## Randomness

The game must be repeatable from a URL game value.

Use a game value from the URL:

```text
?game=1234
```

In code, this value may be named `seed`.
After a valid URL game value exists, use it for all game random number operations.

The game value determines:

* the order in which words are chosen for rounds
* lowercase/uppercase question variant choices
* wrong-answer choices
* the displayed order of answer options, including the position of the correct answer

## Game Mode

The game mode is controlled by the URL parameter `gameMode`.

Use these URL values:

```text
?gameMode=1
```

for `Cyrilic -> Latin`.

```text
?gameMode=2
```

for `Latin -> Cyrilic`.

If `gameMode` is missing or invalid, URL normalization inserts `gameMode=1`.

The UI must have a compact game mode switcher near the question area, above the large question card.
Use a Google Translate-style direction selector: two visible mode buttons, with the active mode visually selected.
Changing mode updates the URL `gameMode` value and reloads using that game mode.

## URL Normalization

The URL must contain valid values for:

* `game`
* `data`
* `gameMode`

If `game` is missing or invalid:

* randomize a game value
* insert it as `game`

If `data` is missing or invalid, insert `data=1`.
If `gameMode` is missing or invalid, insert `gameMode=1`.

If more than one URL value is missing or invalid, update all missing or invalid values before redirecting.
URL normalization must perform at most one redirect for one page load.
For example, a URL with no query string redirects once to a URL containing `game`, `data=1`, and `gameMode=1`.

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

Each dataset entry in JavaScript uses explicit fields:

* `id`
* `label`
* `wordSource`

Each letter transliteration entry in JavaScript uses explicit fields:

* `cyrillic`
* `latin`
* `mustAsk`

The letter transliteration list in `data.js` must be named `LETTER_TRANSLITERATIONS`.

`mustAsk` is a list of up to four Latin answer options that must be shown as wrong choices when they are not the correct answer.
Use `mustAsk` for answer options that visually or phonetically resemble the Cyrillic letter.
For uppercase Cyrillic letters, `latin` and `mustAsk` values are uppercase Latin strings.
Uppercase Cyrillic letters have their own `mustAsk` choices when their visual shape differs from the lowercase Cyrillic letter.

The `mustAsk` values are fixed training requirements.
They must not be changed, removed, reordered, or regenerated unless this requirements file is explicitly updated.

| Cyrillic | Latin | mustAsk |
|---|---|---|
| а | a | o, e, u |
| б | b | v, d, g |
| в | v | b, w, f |
| г | g | r, h, k |
| д | d | g, a, t, l |
| е | e | i, y, a |
| ж | zh | sh, ch, z, j |
| з | z | s, e, zh |
| и | i | n, u, y |
| й | y | i, u, j |
| к | k | x, h, q |
| л | l | r, m, n |
| м | m | n, h, l |
| н | n | h, m, u |
| о | o | a, e, u |
| п | p | n, u, r, b |
| р | r | p, b, l |
| с | s | c, z, k |
| т | t | m, d, n |
| у | u | y, v, w |
| ф | f | o, p, v |
| х | h | x, k, ch |
| ц | ts | c, s, ch |
| ч | ch | sh, ts, c |
| ш | sh | ch, sht, s |
| щ | sht | sh, ch, ts |
| ъ | a | u, y, o |
| ь | y | b, i, u |
| ю | yu | u, ya, y |
| я | ya | r, a, yu |
| А | A | O, E, U |
| Б | B | V, D, G |
| В | V | B, W, F |
| Г | G | L, T, K |
| Д | D | A, L, G, T |
| Е | E | I, Y, A |
| Ж | ZH | SH, CH, Z, J |
| З | Z | S, E, ZH |
| И | I | N, U, Y |
| Й | Y | I, N, U |
| К | K | X, H, Q |
| Л | L | A, M, N |
| М | M | N, H, L |
| Н | N | H, M, U |
| О | O | A, E, U |
| П | P | N, U, R, B |
| Р | R | P, B, L |
| С | S | C, Z, K |
| Т | T | M, D, N |
| У | U | Y, V, W |
| Ф | F | O, P, V |
| Х | H | X, K, CH |
| Ц | TS | C, S, CH, U |
| Ч | CH | SH, TS, C |
| Ш | SH | W, CH, SHT, S |
| Щ | SHT | W, SH, CH, TS |
| Ъ | A | B, U, Y, O |
| Ь | Y | B, I, U |
| Ю | YU | U, YA, Y, O |
| Я | YA | R, A, YU |

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

### Dataset 2: Hiking E3 Kom-Emine words

Dataset 2 contains hiking-relevant Bulgarian words.

It includes:

* words such as train, bus, delay, emergency, thunder, bad weather, feet, tired, well rested, fresh, water, mountain, trail, snake, sheep dog, horse, and mountain peak
* hiking-relevant coverage words such as flashlight, thermal underwear, southern slope, cave, overnight stay, water filter, sun protection, canyon, southern wind, driver, kettle, southern route, southeastern slope, emergency thermal blanket, fleece jacket, canyoning, mountain guide, water source, and I want a place to sleep
* all hut and shelter names on Kom-Emine E3, such as Vezhen hut, Eho hut, and the rest of the route huts

For hut entries, omit the generic Bulgarian `хижа` / Latin `hizha` prefix from roughly 89% of hut entries to avoid overtraining the same letters from repeated prefixes.

Dataset 2 must contain at least one instance of every lowercase Bulgarian Cyrillic character used by the trainer.

The AI must generate the Kom-Emine E3 hut and shelter list from online sources.

Use this dataset when the URL contains:

```text
?data=2
```

### Dataset 3: alphabet letters

Dataset 3 contains all lowercase Bulgarian Cyrillic alphabet letters.

Each dictionary entry is one Cyrillic letter with its Latin spelling.
Dataset 3 must be an explicit `ALPHABET_WORD_SOURCE` array in `data.js`, not generated from `LETTER_TRANSLITERATIONS`.
The game asks either the lowercase or uppercase variant using the same casing selection logic as the other datasets.

Use this dataset when the URL contains:

```text
?data=3
```

The UI must have a game input field with an OK button at the bottom.
When the OK button is pressed, update the URL `game` value and reload using that game value.

The UI must have a dataset dropdown at the bottom next to the game input.

The dropdown options are:

* `top 250 words`
* `Hiking E3 Kom-Emine words`
* `alphabet letters`

## Option Selection

If a Cyrillic letter translates to several Latin letters, that letter combination is one available option.

Wrong choices are selected randomly from a list of letters and letter combinations.
If the current Cyrillic letter has `mustAsk` options, those wrong choices are included before random wrong choices are added.
After the six answer options have been selected, shuffle the full option list.

In `Cyrilic -> Latin` mode, the option list consists of:

* all possible Cyrillic-to-Latin letter combinations
* all Latin letters `a` through `z`

In `Latin -> Cyrilic` mode, the option list consists of all Cyrillic letters from `LETTER_TRANSLITERATIONS` that match the current question casing.
Wrong Cyrillic options are derived by reading `LETTER_TRANSLITERATIONS` backwards.
If the current Cyrillic letter has `mustAsk` Latin values, map those Latin values back to Cyrillic letters and include them as wrong choices when they are not the correct answer.

For example, `zh` is a letter option because it is used when translating `ж`.

Examples:

* `г` has `r` in `mustAsk` because it visually resembles Latin `r`
* `ж` has `sh` and `ch` in `mustAsk` because they are phonetically close
* `н` has `h` in `mustAsk` because it visually resembles Latin `h`



# gui

## gui for letter guess 

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
      [Cyrilic -> Latin] [Latin -> Cyrilic]
      
             Cyrilic -> Latin
 
             +------------+
             |            |
             |     з      |
             |            |
             +------------+

    +---+  +---+  +---+  +---+  +---+  +---+   
    | s |  | k |  | l |  | n |  | p |  | r |
    +---+  +---+  +---+  +---+  +---+  +---+ 

              | next |
 
 
 round: 22     game: [1234] [OK]     data: [top 250 words v]

```

## gui for letter guess - Latin -> Cyrilic

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
      [Cyrilic -> Latin] [Latin -> Cyrilic]
      
             Latin -> Cyrilic
 
             +------------+
             |            |
             |    sht     |
             |            |
             +------------+

    +---+  +---+  +---+  +---+  +---+  +---+   
    | ш |  | ц |  | щ |  | ч |  | с |  | ж |
    +---+  +---+  +---+  +---+  +---+  +---+ 

              | next |
 
 
 round: 22     game: [1234] [OK]     data: [top 250 words v]

```

## gui for round done 1

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
 
        ROUND DONE
        
     WORD: xxxxxx
     In Latin: | show |    
     Meaning: | show | 
         
             
    | show progress |    | next |
 
 
 round: 22     game: [1234] [OK]     data: [top 250 words v]

```

Both `show` buttons reveal both hidden fields: the Latin spelling and the English meaning.

### gui for round done - click done

```
 correct:  2     wrong: 55    ratio: 0.4%    
 
 
        ROUND DONE
        
     WORD: xxxxxx
     In Latin: yyyyyy    
     Meaning: zz zz zz 
         
             
    | show progress |    | next |
 
 
 round: 22     game: [1234] [OK]     data: [top 250 words v]

```
