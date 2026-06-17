# code requirements
we need a program in html and js. it must run with a simple js stack. perhaps bootstrap and jquery

the game has to be mobile first designed


# goal
We want to train cyrilic letters for people only knowing the latin alphabet. 
it will be a game where a cyrilic letter is presented with 5 options one is correct and 4 is wrong. 
The options are latin letter/letterss tha correspond to the cyrilic letter.

if the user selects the correct one a successCounter is incremented, if the wrong answer is chosen a failCounter is incremented. 
After each increment a success-ratio is calculated

successcounter and failcounter and successratio is displayed at the top.

also a rounds counter is presented

there is a "seed" chosen from the url - the seed is used in all random number operations. if no seed is found in the url randomize a seed and redirect to yourself with the seed added to the url.


## how letters are chosen
the game knows "a dictionary" of the top 250 most common bulgarian words. these are stored in a separate .js file in a structure with 
* the cyrilic spelling
* the latin spelling
* an english translation of the word

the game consists of rounds.
* at the start of each round a random word is chosen from the dictionary 
* for each letter in the word, one at a time, we ask the user what this cyrilic letter is in latin, and the user is presented with 5 choices. 
* when all letters has been processed the whole word is presented along with a translation and an continue button
* when the continue button is pressed a new round is started.







