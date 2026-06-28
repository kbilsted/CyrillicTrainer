# Product requirements

## Ownership

This file owns product behavior: game rules, domain model, data model, scoring and progress rules, URL behavior, dataset requirements, and UI behavior.
Keep this file detailed enough that the product can be recreated from the markdown files.
Do not put implementation stack, file layout, script order, or coding style here; those belong in `agent.md`.

## Goal

Build a game that trains Cyrillic letters for people who only know the Latin alphabet.

## Game modes
The game has two game modes:

* `Cyrilic → Latin`
* `Latin → Cyrilic`

The title of the active game mode is shown above the large question card for each question.

In `Cyrilic → Latin` mode, the game presents one Cyrillic letter at a time with six Latin options.

In `Latin → Cyrilic` mode, the game presents one Latin letter or letter combination at a time with six Cyrillic options.
The Latin question values are derived by reading `LETTER_TRANSLITERATIONS` backwards.
For example, `sht` can be a Latin question and `щ` is the correct Cyrillic answer.
If several Cyrillic characters share the same Latin transliteration, the current word's exact Cyrillic character determines the correct answer.

For both modes, each question has:

* one correct option
* five wrong options

The options are Latin letters or letter combinations in `Cyrilic → Latin` mode.
The options are Cyrillic letters in `Latin → Cyrilic` mode.

the ui language is english

letters can be lowercase or uppercase Cyrillic.
When the shown Cyrillic letter is uppercase, all Latin answer options are uppercase too.

## Named Concepts

Use these names consistently for the core entities:

* `LETTER_TRANSLITERATIONS`: the authoritative Cyrillic-to-Latin transliteration table
* `gameMode`: the URL parameter and product concept for choosing translation direction
* `UserProgressStats`: the JavaScript class that owns the user's learning progress fields and derived stats
* `GameState`: the JavaScript class that owns persisted game-flow fields and the runtime seeded word order
* `CurrentWordState`: the JavaScript class that owns runtime progress inside the active word round
* `recentCorrectLetters`: a flat list of up to 20 recently correct Cyrillic character variants. 
* `letterErrorCounts`: the persisted dictionary of exact Cyrillic character error counts
* `wordCursor`: the persisted index of the next word to consider in the seeded word order
* `currentWordIndex`: the persisted index of the word currently being asked
* `currentWordHadWrongAnswer`: the persisted flag that decides whether the current word must repeat

## Game Flow State

Game flow state must be represented by a `GameState` class.
`GameState` owns these fields:

* `roundCounter`
* `wordOrder`
* `wordCursor`
* `currentWordIndex`
* `currentWordHadWrongAnswer`
* `gameOver`

`wordOrder` is generated from the URL `game` value and selected dataset.
It may be stored only at runtime because it can be recreated deterministically from the current URL and dataset.

`GameState` owns these methods:

* `setWordOrder(wordOrder, wordSourceLength)`
* `reset()`
* `toJSON()`
* `fromJSON(raw)`

When all game-flow state must be reset, call `GameState.reset()` instead of listing every game-flow field at the call site.

The active question state is not part of `GameState`.
Active word-round state must be represented by a `CurrentWordState` class.
`CurrentWordState` owns these fields:

* `word`
* `letters`
* `letterIndex`
* `correctAnswer`
* `isQuestionAnswered`

`CurrentWordState` owns these methods:

* `skipRecentlyCorrectLetters(userProgressStats)`
* `hasCurrentLetter()`
* `getCurrentLetter()`
* `setCurrentQuestionAnswer(correctAnswer)`
* `markQuestionAnswered()`
* `hasAnsweredQuestion()`
* `getCorrectAnswer()`
* `isAnswerCorrect(answer)`
* `advanceToNextLetter()`

`CurrentWordState` is runtime-only.
It is recreated for each started word and must not be persisted.

## Scoring

User progress must be represented by a `UserProgressStats` class.
The class must be defined in `userProgressStats.js`.
The class must not be defined in `storage.js`.
`game.js` owns the active `UserProgressStats` instance and calls its methods directly.
`storage.js` must only persist and load app state.
`storage.js` must expose a `load()` method and a `save(state)` method.
`save(state)` stores all persisted app state, including `UserProgressStats` data and `GameState` data.
After changing any persisted state, call `save(state)`.
The storage format does not need to be backward compatible with older versions.

`UserProgressStats` owns these fields:

* `successCounter`
* `failCounter`
* `recentCorrectLetters`
* `letterErrorCounts`

`UserProgressStats` owns these methods:

* `recordCorrectLetter(cyrillicLetter)`
* `recordWrongLetter(cyrillicLetter)`
* `wasRecentlyCorrect(cyrillicLetter)`
* `getDisplayStats()`
* `getLetterErrorCounts()`
* `reset()`
* `toJSON()`
* `fromJSON(raw)`

`roundCounter` is not part of `UserProgressStats`.
`roundCounter` is part of `GameState` because it describes game flow, not the user's answer progress.

`recentCorrectLetters` stores both case variants for each correctly answered Cyrillic character.
For example, if `а` was answered correctly, add both `а` and `А` to `recentCorrectLetters`.
After each correct answer, trim `recentCorrectLetters` to the newest 20 entries.

If the user selects the correct answer:

* call `recordCorrectLetter(cyrillicLetter)`, which increments `successCounter` and updates `recentCorrectLetters`

If the user selects a wrong answer:

* call `recordWrongLetter(cyrillicLetter)`, which increments `failCounter` and increments the error count for the exact Cyrillic character that was asked

After each answer:

* calculate the success ratio using % and 1 digit after the dot (precision)
* display `successCounter`, `failCounter`, success ratio, and round counter at the top
* persist scores in `localStorage`

The game screen has a centered red `new game` button at the bottom.
When pressed, show a confirmation dialog warning that scores, recent correct letters, and error progress will be cleared.
If the user confirms, clear persisted progress and navigate to the front page URL with no query parameters.
If the user cancels, do not clear progress and stay in the game.

The game stores a persisted dictionary of Cyrillic letter error counts in `localStorage`.
The dictionary maps each exact Cyrillic character to the number of wrong answers for that character:

* key: Cyrillic character
* value: `errorCount`

The error-count dictionary is case-sensitive.
Lowercase and uppercase Cyrillic characters are tracked separately.

## Rounds

The game consists of rounds.

The first round is `1`.
Reloading the page must not increment `roundCounter`.
`roundCounter` is incremented only when the user presses the round-done `next` button to start the next round.

At the start of each round:

* create one seeded shuffled order of all words in the current dataset
* use `wordCursor` to walk through that seeded word order
* choose the next word in the seeded order that contains at least one Cyrillic letter variant that is not in `recentCorrectLetters`
* do not exclude a word just because it also contains one or more letters from `recentCorrectLetters`
* if a word has no askable letters because all its letter variants are in `recentCorrectLetters`, skip that word permanently for the current game and increment `wordCursor`
* if the previous round for the current word had one or more wrong answers, repeat the same word instead of advancing `wordCursor`
* repeat the same word until the user completes a round for that word without wrong answers
* if `wordCursor` reaches the end of the seeded word order and there is no repeated word, the game is over

For each Cyrillic letter in the word:

* if the Cyrillic letter is in `recentCorrectLetters`, skip it and go to the next Cyrillic letter
* in `Cyrilic → Latin` mode, ask the user what the Cyrillic letter is in Latin
* in `Latin → Cyrilic` mode, show the Latin transliteration and ask the user which Cyrillic letter it represents
* show the active game mode title above the large question card
* show the text `which is the correct translation` below the large question card and above the six answer options
* show six clickable option buttons
* when the answer buttons appear at the start of a new round, animate them with a subtle zoom effect from left to right
* if the user selects a wrong answer, show the correct choice so the player learns
* if the user selects the correct answer, show that it was correct
* if the selected answer turns red, apply a brief shake animation to that wrong button
* the color of the button is red or green. red if wrong. green if correct. if the button turns red, then also make the correct choice green.
* add an "next" button for the next letter to guess the translation for. the button is automatically clicked after 500 ms in case user answered correctly.

For each dataset, each trainable Cyrillic letter in a word creates one question, using either the lowercase or uppercase variant.
For example, the word letter `г` creates a question for either `г` or `Г`, not both.

The game stores up to 20 recently correct Cyrillic character variants in `localStorage`.
Letters answered incorrectly are not remembered for this skip rule.
Wrong answers only affect word selection by causing the current word to repeat until a later round for the same word has no wrong answers.

When all letters in a word have been processed:

* show the whole word in Cyrillic
* show a subtitle: `now try reading the word aloud...`
* show the phonetic spelling on its own `phonetic:` row, hidden behind a `show` button
* show the Latin spelling
* show the English translation
* show a `show progress` button
* show a `next` button if the word was completed without wrong answers
* show a `retry word` button if the word had one or more wrong answers and will repeat

When the `show progress` button is pressed:

* show a histogram of all Cyrillic letters that have at least one error
* each histogram bar shows the Cyrillic letter and its `errorCount`
* sort bars left to right by highest `errorCount` first
* keep the histogram mobile-friendly when many letters have errors by allowing horizontal scrolling instead of shrinking bars until labels become unreadable
* if there are no errors, show an empty progress message

When the round-done `next` or `retry word` button is pressed:

* if a new round can start, increment `roundCounter` and start that new round
* if no new round can start because the seeded word order is exhausted, keep `roundCounter` unchanged and show the game-over view

When the game is over:

* hide the letter question view and round-done view
* show a dedicated `GAME DONE` view
* show the final `successCounter`, `failCounter`, and success ratio
* show the error-count histogram
* show a `new game` button

When the `new game` button is pressed:

* show a confirmation dialog warning that scores, recent correct letters, and error progress will be cleared
* if confirmed, clear persisted progress and navigate to the front page URL with no query parameters
* if canceled, do not clear progress and stay in the game-over view

## game-number and explicit seed randomness

The game must be repeatable from a URL game value. we use a seed for the random function which will be used when generating random numbers.

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

The `game` value is chosen on the front page before starting the game.
The front page has a retry-arrow button next to the `game` input that generates a new random game value.
Starting a game from the front page clears persisted progress and navigates to `game.html` with a URL containing the chosen `game`, `data`, and `gameMode` values.

## Game Mode

The game mode is controlled by the URL parameter `gameMode`.

Use these URL values:

```text
?gameMode=1
```

for `Cyrilic → Latin`.

```text
?gameMode=2
```

for `Latin → Cyrilic`.

The front page lets the user choose the game mode before starting the game.
The start mode on the front page is `Cyrilic → Latin`.

The active game mode title is shown above the large question card during the game.

## URL Normalization

`index.html` is the front page.
The front page with no query parameters must not redirect.

`game.html` is the game screen.
A `game.html` URL must contain valid values for:

* `game`
* `data`
* `gameMode`

If any value is missing or invalid, redirect to the front page.
Do not insert default values into a `game.html` URL.

## Data Model

The game has three datasets.

The dictionary and letter lists must be generated in `data.js`, which is imported by the game.

The AI must provide the lists and verify the Bulgarian words, Latin spellings, phonetic spellings, and English meanings carefully because the dataset is core to the game.

Each dictionary entry contains:

* Cyrillic spelling
* Latin spelling
* phonetic spelling
* English translation

Each dictionary entry in JavaScript uses explicit fields:

* `cyrillic`
* `latin`
* `phonetic`
* `englishMeaning`



### Phonetic field

The `phonetic` field is an ASCII, English-style pronunciation helper shown on its own `phonetic:` row in the round-done view.
It must be generated from the Cyrillic spelling, not copied from the `latin` field.
It may include syllable separators and stress markers.

Use `-` between syllables when that improves readability.
Use an ASCII apostrophe directly before the stressed syllable when the Bulgarian stress has been verified:

```text
kuh-'deh
```

Do not guess Bulgarian stress from spelling. Bulgarian stress is not reliably derivable from the written word.
If stress has not been verified, keep the phonetic spelling unmarked instead of adding a guessed apostrophe.
Single-letter alphabet entries do not need a stress marker.

Use this phonetic mapping:

| Cyrillic | Phonetic |
| --- | --- |
| `а` | `a` |
| `б` | `b` |
| `в` | `v` |
| `г` | `g` |
| `д` | `d` |
| `е` | `eh` |
| `ж` | `zh` |
| `з` | `z` |
| `и` | `ee` |
| `й` | `y` |
| `к` | `k` |
| `л` | `l` |
| `м` | `m` |
| `н` | `n` |
| `о` | `o` |
| `п` | `p` |
| `р` | `r` |
| `с` | `s` |
| `т` | `t` |
| `у` | `oo` |
| `ф` | `f` |
| `х` | `kh` |
| `ц` | `ts` |
| `ч` | `ch` |
| `ш` | `sh` |
| `щ` | `sht` |
| `ъ` | `uh` |
| `ь` | `y` |
| `ю` | `yu` |
| `я` | `ya` |

Uppercase Cyrillic letters use the same mapping with an uppercase first Latin letter.

### Other data
Each dataset entry in JavaScript uses explicit fields:

* `id`
* `label`
* `wordSource`

Each letter transliteration entry in JavaScript uses explicit fields:

* `cyrillic`
* `latin`
* `cyrillicToLatinMustAsk`
* `latinToCyrillicMustAsk`

The letter transliteration list in `data.js` must be named `LETTER_TRANSLITERATIONS`.

`cyrillicToLatinMustAsk` is a list of up to four Latin answer options that must be shown as wrong choices in `Cyrilic → Latin` mode when they are not the correct answer.
Use `cyrillicToLatinMustAsk` for Latin answer options that visually or phonetically resemble the Cyrillic letter.

`latinToCyrillicMustAsk` is a list of up to four Cyrillic answer options that must be shown as wrong choices in `Latin → Cyrilic` mode when they are not the correct answer.
Use `latinToCyrillicMustAsk` for Cyrillic answer options that visually resemble the Latin prompt or are likely reverse-translation confusions.

For uppercase Cyrillic letters, `latin`, `cyrillicToLatinMustAsk`, and `latinToCyrillicMustAsk` values use uppercase strings.
Uppercase Cyrillic letters have their own must-ask choices when their visual shape differs from the lowercase Cyrillic letter.

The `cyrillicToLatinMustAsk` and `latinToCyrillicMustAsk` values are fixed training requirements.
They must not be changed, removed, reordered, or regenerated unless this requirements file is explicitly updated.

| Cyrillic | Latin | cyrillicToLatinMustAsk | latinToCyrillicMustAsk |
|---|---|---|---|
| а | a | o, e, u | ъ, о, е, у |
| б | b | v, d, g | в, д, г |
| в | v | b, w, f | б, ъ, ь, ф |
| г | g | r, h, k | р, х, к |
| д | d | g, a, t, l | г, а, ъ, т |
| е | e | i, y, a | и, й, ь, а |
| ж | zh | sh, ch, z, j | ш, ч, з |
| з | z | s, e, zh | с, е, ж |
| и | i | n, u, y | н, у, й, ь |
| й | y | i, u, j | ь, и, у |
| к | k | x, h, q | х |
| л | l | r, m, n | р, м, н |
| м | m | n, h, l | н, х, л |
| н | n | h, m, u | х, м, у |
| о | o | a, e, u | а, ъ, е, у |
| п | p | n, u, r, b | н, у, р, б |
| р | r | p, b, l | п, б, л |
| с | s | c, z, k | з, к |
| т | t | m, d, n | м, д, н |
| у | u | y, v, w | й, ь, в |
| ф | f | o, p, v | о, п, в |
| х | h | x, k, ch | к, ч |
| ц | ts | c, s, ch | с, ч |
| ч | ch | sh, ts, c | ш, ц |
| ш | sh | ch, sht, s | ч, щ, с |
| щ | sht | sh, ch, ts | ш, ч, ц |
| ъ | a | u, y, o | а, у, й, ь |
| ь | y | b, i, u | й, б, и, у |
| ю | yu | u, ya, y | у, я, й, ь |
| я | ya | r, a, yu | р, а, ъ, ю |
| А | A | O, E, U | Ъ, О, Е, У |
| Б | B | V, D, G | В, Д, Г |
| В | V | B, W, F | Б, Ъ, Ь, Ф |
| Г | G | L, T, K | Л, Т, К |
| Д | D | A, L, G, T | А, Ъ, Л, Г |
| Е | E | I, Y, A | И, Й, Ь, А |
| Ж | ZH | SH, CH, Z, J | Ш, Ч, З |
| З | Z | S, E, ZH | С, Е, Ж |
| И | I | N, U, Y | Н, У, Й, Ь |
| Й | Y | I, N, U | Ь, И, Н, У |
| К | K | X, H, Q | Х |
| Л | L | A, M, N | А, Ъ, М, Н |
| М | M | N, H, L | Н, Х, Л |
| Н | N | H, M, U | Х, М, У |
| О | O | A, E, U | А, Ъ, Е, У |
| П | P | N, U, R, B | Н, У, Р, Б |
| Р | R | P, B, L | П, Б, Л |
| С | S | C, Z, K | З, К |
| Т | T | M, D, N | М, Д, Н |
| У | U | Y, V, W | Й, Ь, В |
| Ф | F | O, P, V | О, П, В |
| Х | H | X, K, CH | К, Ч |
| Ц | TS | C, S, CH, U | С, Ч, У |
| Ч | CH | SH, TS, C | Ш, Ц |
| Ш | SH | W, CH, SHT, S | Ч, Щ, С |
| Щ | SHT | W, SH, CH, TS | Ш, Ч, Ц |
| Ъ | A | B, U, Y, O | А, Б, У, Й |
| Ь | Y | B, I, U | Й, Б, И, У |
| Ю | YU | U, YA, Y, O | У, Я, Й, Ь |
| Я | YA | R, A, YU | Р, А, Ъ, Ю |

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
* hiking-relevant coverage words such as flashlight, thermal underwear, southern slope, cave, overnight stay, water filter, sun protection, canyon, southern wind, driver, kettle, southern route, southeastern slope, emergency thermal blanket, fleece jacket, canyoning, mountain guide, water source, I want a place to sleep, steep or steeply, and overgrown
* all hut and shelter names on Kom-Emine E3, such as Vezhen hut, Eho hut, and the rest of the route huts

For hut, shelter, and other trail accommodation name entries in dataset 2, the `englishMeaning` value includes the suffix ` on trail E3 Kom-Emine`.

For hut entries, omit the generic Bulgarian `хижа` / Latin `hizha` prefix from roughly 89% of hut entries to avoid overtraining the same letters from repeated prefixes.

Dataset 2 must contain at least one instance of every lowercase Bulgarian Cyrillic character used by the trainer.

The AI must generate the Kom-Emine E3 hut and shelter list from online sources.

Use this dataset when the URL contains:

```text
?data=2
```

### Dataset 3: alphabet letters

Dataset 3 contains one word with all lowercase Bulgarian Cyrillic alphabet letters.

The single dictionary entry contains the full lowercase alphabet as its Cyrillic word.
Dataset 3 must be an explicit `ALPHABET_WORD_SOURCE` array in `data.js`, not generated from `LETTER_TRANSLITERATIONS`.
The game asks either the lowercase or uppercase variant using the same casing selection logic as the other datasets.

Use this dataset when the URL contains:

```text
?data=3
```

The front page is `index.html`.
The game screen is `game.html`.
The front page must show the game logo.
The front page logo uses `cyrillic_trainer_logo.svg`.
The logo already contains the text `Cyrillic trainer`, so do not render a separate text title next to or below it.
The logo should be very large on mobile, up to the available mobile width, but capped so it does not fill the full width on larger screens.
The front page must let the user choose:

* dataset
* game mode direction
* `game`

The front page uses the visible label `word list:` for dataset selection.
The front page defaults to the `Hiking E3 Kom-Emine words` dataset.
The front page game-mode direction control uses a dropdown.
The `game` field has a retry-arrow button next to it that generates a new random game value.
The front page has a `start game` button.
When pressed, it clears persisted progress and redirects to `game.html` with `game`, `data`, and `gameMode` query parameters.

The round counter must be shown in the top score line during the game.
The game screen bottom line must have a `new game` button that navigates to `index.html`.
The UI must show `A game by Kasper B. Graversen` as a small line at the bottom below the controls.

The dropdown options are:

* `Top 250 used Bulgarian words`
* `Hiking E3 Kom-Emine words`
* `All alphabet letters`

## Option Selection

If a Cyrillic letter translates to several Latin letters, that letter combination is one available option.

Wrong choices are selected randomly from a list of letters and letter combinations.
If the current Cyrillic letter has must-ask options for the active mode, those wrong choices are included before random wrong choices are added.
After the six answer options have been selected, shuffle the full option list.

In `Cyrilic → Latin` mode, the option list consists of:

* all possible Cyrillic-to-Latin letter combinations
* all Latin letters `a` through `z`

In `Latin → Cyrilic` mode, the option list consists of all Cyrillic letters from `LETTER_TRANSLITERATIONS` that match the current question casing.
Wrong Cyrillic options are selected from `latinToCyrillicMustAsk` first, then random Cyrillic choices are added.

For example, `zh` is a letter option because it is used when translating `ж`.

Examples:

* `г` has `r` in `cyrillicToLatinMustAsk` because it visually resembles Latin `r`
* `ж` has `sh` and `ch` in `cyrillicToLatinMustAsk` because they are phonetically close
* `н` has `h` in `cyrillicToLatinMustAsk` because it visually resembles Latin `h`
* `в` has `б`, `ъ`, `ь`, and `ф` in `latinToCyrillicMustAsk` because those Cyrillic choices are likely visual confusions for the reverse direction



# gui

## gui for front page

```
          [logo]

 word list: [Hiking E3 Kom-Emine words v]

 direction: +-------------------------------------------+
            |   Cyrilic → Latin   |   Latin → Cyrilic   |
            +-------------------------------------------+

 game:      [123456789] [↻]

        | start game |

      A game by Kasper B. Graversen
```

## gui for letter guess 

```
 correct:  2     wrong: 55    ratio: 0.4%    round: 22
 
             Cyrilic → Latin
 
             +------------+
             |            |
             |     з      |
             |            |
             +------------+

       which is the correct translation

    +---+  +---+  +---+  +---+  +---+  +---+   
    | s |  | k |  | l |  | n |  | p |  | r |
    +---+  +---+  +---+  +---+  +---+  +---+ 

              | next |
 
 
              | new game |
          A game by Kasper B. Graversen

```

## gui for letter guess - Latin → Cyrilic

```
 correct:  2     wrong: 55    ratio: 0.4%    round: 22
 
             Latin → Cyrilic
 
             +------------+
             |            |
             |    sht     |
             |            |
             +------------+

       which is the correct translation

    +---+  +---+  +---+  +---+  +---+  +---+   
    | ш |  | ц |  | щ |  | ч |  | с |  | ж |
    +---+  +---+  +---+  +---+  +---+  +---+ 

              | next |
 
 
              | new game |
          A game by Kasper B. Graversen

```

## gui for round done 1

```
 correct:  2     wrong: 55    ratio: 0.4%    round: 22
 
 
        Round done
        now try reading the word aloud...
        
     WORD: xxxxxx
     phonetic: | show |
     In Latin: | show |    
     Meaning: | show | 
         
             
    | show progress |    | next |
 
 
              | new game |
          A game by Kasper B. Graversen

```

All `show` buttons reveal all hidden fields: the phonetic spelling, the Latin spelling, and the English meaning.
If the round had one or more wrong answers, the `next` button label is `retry word`.

### gui for round done - click done

```
 correct:  2     wrong: 55    ratio: 0.4%    round: 22
 
 
        Round done
        now try reading the word aloud...
        
     WORD: xxxxxx
     phonetic: pppppp
     In Latin: yyyyyy    
     Meaning: zz zz zz 
         
             
    | show progress |    | next |
 
 
              | new game |
          A game by Kasper B. Graversen

```

### gui for game done

```
 correct:  42     wrong: 8    ratio: 84.0%    round: 31
 
 
        GAME DONE
        
     Correct: 42
     Wrong:   8
     Ratio:   84.0%
         
     [error histogram]
             
              | new game |

          A game by Kasper B. Graversen

```
