# code requirements
we need a program in html and js. it must run with a simple js stack with bootstrap and jquery

the game has to be mobile first designed.. ie no use of dropdowns, and assume a narrow window width

we iam for a completely static html, and js files

# goal
We want to train cyrilic letters for people only knowing the latin alphabet. 
it will be a game where a cyrilic letter is presented with 5 options one is correct and 4 is wrong. 
The options are latin letter/letterss tha correspond to the cyrilic letter.

if the user selects the correct one a successCounter is incremented, if the wrong answer is chosen a failCounter is incremented. 
After each increment a success-ratio is calculated


# randomnes
* we want the games to be repeatble but also changing.
* we use a  "seed" chosen from the url, "?seed=1234"
* the seed is used in all random number operations. 
* if no seed is found in the url randomize a seed and redirect to yourself with the seed added to the url.
* the only thing that should not be repeatble from the seed is the position of the correct letter-choice

## scoring
successcounter and failcounter and successratio is displayed at the top.

also a rounds counter is presented

scores are stored in localstorage


# how letters are chosen
the game knows "a dictionary" of the top 250 most common bulgarian words in a structure with 
* the cyrilic spelling
* the latin spelling
* an english translation of the word
* ie "ж" has the latin spelling  "zh", "щ" is  "sht"

the game consists of rounds.
* at the start of each round a random word is chosen from the dictionary 
* for each cyrilic letter in the word, one at a time, we ask the user what this cyrilic letter is in latin, and the user is presented with 5 choices. 
* options are shown as buttons that can be clicked
* when the continue button is pressed a new round is started.
* if the user selects the wrong letter the correct choice is shown - so player learns. if the correct answer is chosen then it is shown.
* when all letters of a word has been processed the round ends by showing the whole word in cyrilic, latin  along with a translation and an continue button


## how options are chosen
* if a letter translate to several latin letters than those letters will be one of the options available
* the wrong choices are as a random choice from a list of "letters", the seed is used so we can replay the same game
* the list of "letters" are all the possible letter combinations from a cyrilic letter to a latin letter + all latin letters "a..z". e.g. "zh" is a letter since it is used in translating "ж" 
* the correct answer is on always in the same place when giving users choices. not using the seed.


# data 
the dictionary and the letterlist are generated in a separate js file which is imported.
the lists are provided by the ai


