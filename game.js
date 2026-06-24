// Module wrapper that owns game state and publishes CyrillicGame.init.
// Called immediately by the browser when game.js is loaded.
(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicUI;
  const CORRECT_ANSWER_AUTO_NEXT_DELAY_MS = 500;
  const WRONG_ANSWER_OPTION_COUNT = 5;
  const RECENT_CORRECT_LETTER_LIMIT = 10;

  let seed = null;
  let dataSetId = null;
  let currentDataSet = null;
  let nextRandom = null;
  let currentWord = null;
  let currentLetters = [];
  let currentLetterIndex = 0;
  let currentCorrectAnswer = null;
  let hasAnswered = false;
  let autoNextTimer = null;
  let recentCorrectLetters = [];
  let lastWrongAnswer = null;

  // Cancels a pending correct-answer auto-next timer so navigation stays single-step.
  // Called before starting, resetting, showing, or manually advancing questions.
  function clearAutoNextTimer() {
    if (autoNextTimer !== null) {
      window.clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  // Finds the configured Latin answer and mustAsk list for a Cyrillic character.
  // Called only by showCurrentLetter.
  function getTransliterationForLetter(cyrillicLetter) {
    // Finds the transliteration entry matching the requested Cyrillic character.
    // Called only by Array.find in getTransliterationForLetter.
    const match = data.letterTransliterations.find((letter) => letter.cyrillic === cyrillicLetter);

    if (!match) {
      throw new Error(`Missing transliteration for ${cyrillicLetter}`);
    }

    return match;
  }

  // Checks whether a character exists in LETTER_TRANSLITERATIONS.
  // Called by getQuestionLetterVariants and getWordLetters.
  function isTrainableLetter(letter) {
    // Checks one transliteration entry against the input character.
    // Called only by Array.some in isTrainableLetter.
    return data.letterTransliterations.some((item) => item.cyrillic === letter);
  }

  // Returns the trainable lowercase/uppercase variants for one source character.
  // Used when selecting casing, available questions, and last-wrong review words.
  function getQuestionLetterVariants(letter) {
    const lowerLetter = letter.toLowerCase();
    const upperLetter = letter.toUpperCase();

    // Keeps valid unique casing variants that are trainable.
    // Called only by Array.filter in getQuestionLetterVariants.
    return [lowerLetter, upperLetter].filter((variant, index, variants) => (
      isTrainableLetter(variant)
      && variants.indexOf(variant) === index
    ));
  }

  // Extracts only trainable Cyrillic characters from a dictionary entry.
  // Used by word selection, round-letter creation, and review matching.
  function getWordLetters(word) {
    return Array.from(word.cyrillic).filter(isTrainableLetter);
  }

  // Checks whether a word contains the requested Cyrillic letter, ignoring casing.
  // Called only by chooseRoundWord for lastWrongAnswer review.
  function wordContainsQuestionLetter(word, questionLetter) {
    const normalizedQuestionLetter = questionLetter.toLowerCase();

    // Checks one source word letter against the requested letter.
    // Called only by Array.some in wordContainsQuestionLetter.
    return getWordLetters(word).some((letter) => letter.toLowerCase() === normalizedQuestionLetter);
  }

  // Expands a word into every lowercase/uppercase question variant it can ask.
  // Called only by chooseRoundWord.
  function getAvailableQuestionLetters(word) {
    return getWordLetters(word).flatMap(getQuestionLetterVariants);
  }

  // Chooses lowercase or uppercase for one source character, preferring non-recent variants.
  // Called only by getRoundLetters.
  function chooseQuestionLetter(letter) {
    const variants = getQuestionLetterVariants(letter);
    // Keeps casing variants that are not currently in the recent-correct list.
    // Called only by Array.filter in chooseQuestionLetter.
    const availableVariants = variants.filter((variant) => !wasRecentlyCorrect(variant));

    return random.choose(
      nextRandom,
      availableVariants.length > 0 ? availableVariants : variants
    );
  }

  // Checks the runtime copy of the last 10 correctly answered Cyrillic characters.
  // Called by question selection and skip logic.
  function wasRecentlyCorrect(letter) {
    return recentCorrectLetters.includes(letter);
  }

  // Returns true when this exact question character should be skipped by the last-10 rule.
  // Called only by moveToNextAvailableLetter.
  function shouldSkipQuestionLetter(letter) {
    return wasRecentlyCorrect(letter);
  }

  // Adds a correctly answered character to the last-10 list and persists it.
  // Called only by handleAnswer.
  function rememberCorrectLetter(letter) {
    recentCorrectLetters.push(letter);

    if (recentCorrectLetters.length > RECENT_CORRECT_LETTER_LIMIT) {
      recentCorrectLetters = recentCorrectLetters.slice(-RECENT_CORRECT_LETTER_LIMIT);
    }

    storage.setRecentCorrectLetters(recentCorrectLetters);
  }

  // Returns words with at least one question that will not be skipped by recent-correct.
  // Called only by chooseRoundWord.
  function getRoundCandidateWords() {
    const wordsWithAskableLetters = currentDataSet.wordSource.filter((word) => (
      // Checks one possible question letter for recent-correct availability.
      // Called only by Array.some inside getRoundCandidateWords.
      getAvailableQuestionLetters(word).some((letter) => !wasRecentlyCorrect(letter))
    ));

    return wordsWithAskableLetters.length > 0 ? wordsWithAskableLetters : currentDataSet.wordSource;
  }

  // Chooses the next word, optionally preferring one that can review lastWrongAnswer.
  // Called only by startRound.
  function chooseRoundWord(preferredLetter) {
    // Candidate words may contain recent-correct letters; those letters are skipped later.
    const candidateWords = getRoundCandidateWords();

    if (preferredLetter !== null) {
      // Keeps candidate words that contain the previous wrong character, ignoring casing.
      // Called only by Array.filter in chooseRoundWord.
      const preferredWords = candidateWords.filter((word) => (
        wordContainsQuestionLetter(word, preferredLetter)
      ));

      if (preferredWords.length > 0) {
        return random.choose(nextRandom, preferredWords);
      }
    }

    return random.choose(
      nextRandom,
      candidateWords
    );
  }

  // Builds the question letters for a round.
  // Called only by startRound.
  function getRoundLetters(word) {
    // Converts each source word letter into the exact question character for this round.
    // Called only by Array.map in getRoundLetters.
    return getWordLetters(word).map(chooseQuestionLetter);
  }

  // Builds six answer options: the correct transliteration plus five wrong choices.
  // Called only by showCurrentLetter.
  function chooseOptions(letterTransliteration) {
    const correctAnswer = letterTransliteration.latin;
    const isUppercaseLetter = letterTransliteration.cyrillic === letterTransliteration.cyrillic.toUpperCase();
    // Uppercases option values when the current Cyrillic question is uppercase.
    // Called only by Array.map in chooseOptions.
    const letterOptions = data.letterOptions.map((option) => (
      isUppercaseLetter ? option.toUpperCase() : option
    ));
    const mustAskChoices = (letterTransliteration.mustAsk || [])
      // Keeps unique valid mustAsk choices that are not the correct answer.
      // Called only by Array.filter in chooseOptions.
      .filter((option, index, options) => (
        option !== correctAnswer
        && letterOptions.includes(option)
        && options.indexOf(option) === index
      ))
      .slice(0, 4);
    // Keeps all option values except the correct answer.
    // Called only by Array.filter in chooseOptions.
    const wrongChoices = letterOptions.filter((option) => option !== correctAnswer);
    // Removes already-forced mustAsk choices before random wrong choices are selected.
    // Called only by Array.filter in chooseOptions.
    const extraWrongChoices = wrongChoices.filter((option) => !mustAskChoices.includes(option));
    const shuffledExtraWrongChoices = random.shuffleSeeded(nextRandom, extraWrongChoices);
    const selectedWrongChoices = mustAskChoices
      .concat(shuffledExtraWrongChoices)
      .slice(0, WRONG_ANSWER_OPTION_COUNT);

    return random.shuffleSeeded(nextRandom, selectedWrongChoices.concat(correctAnswer));
  }

  // Pushes current persisted stats and seed into the UI.
  // Called after round and answer state changes.
  function renderStats() {
    ui.renderStats(storage.getStats(), seed);
  }

  // Switches to the round-done view for the current word and refreshes stats.
  // Called only by showCurrentLetter when no question letters remain.
  function showRoundDone() {
    ui.showRoundDone(currentWord);
    renderStats();
  }

  // Skips letters already answered correctly within the recent-correct window.
  // Called only by showCurrentLetter.
  function moveToNextAvailableLetter() {
    while (
      currentLetterIndex < currentLetters.length
      && shouldSkipQuestionLetter(currentLetters[currentLetterIndex])
    ) {
      currentLetterIndex += 1;
    }

    return currentLetterIndex < currentLetters.length;
  }

  // Renders the current letter question or ends the round if all letters are skipped/done.
  // Called by startRound and handleLetterNext.
  function showCurrentLetter() {
    clearAutoNextTimer();

    if (!moveToNextAvailableLetter()) {
      showRoundDone();
      return;
    }

    const currentLetter = currentLetters[currentLetterIndex];
    const letterTransliteration = getTransliterationForLetter(currentLetter);
    currentCorrectAnswer = letterTransliteration.latin;
    hasAnswered = false;
    ui.showLetterGuess(currentLetter, chooseOptions(letterTransliteration));
    renderStats();
  }

  // Starts a new word round, applying any pending lastWrongAnswer review first.
  // Called by init, reset, and the UI round-next callback.
  function startRound() {
    clearAutoNextTimer();
    storage.incrementRound();
    const preferredLetter = lastWrongAnswer;
    currentWord = chooseRoundWord(preferredLetter);
    lastWrongAnswer = null;
    currentLetters = getRoundLetters(currentWord);
    currentLetterIndex = 0;
    showCurrentLetter();
  }

  // Handles the UI reset button by clearing storage, runtime recent letters, and review state.
  // Called only through the UI reset callback.
  function handleReset() {
    clearAutoNextTimer();
    storage.resetProgress();
    recentCorrectLetters = [];
    lastWrongAnswer = null;
    startRound();
  }

  // Handles a selected answer, updates score/recent state, and records lastWrongAnswer.
  // Called only through the UI answer callback.
  function handleAnswer(selectedAnswer) {
    if (hasAnswered) {
      return;
    }

    hasAnswered = true;

    if (selectedAnswer === currentCorrectAnswer) {
      rememberCorrectLetter(currentLetters[currentLetterIndex]);
      storage.incrementSuccess();
      // Auto-advances after a correct answer once the feedback has been visible briefly.
      // Called only by window.setTimeout in handleAnswer.
      autoNextTimer = window.setTimeout(() => {
        autoNextTimer = null;
        handleLetterNext();
      }, CORRECT_ANSWER_AUTO_NEXT_DELAY_MS);
    } else {
      lastWrongAnswer = currentLetters[currentLetterIndex];
      storage.incrementFail();
    }

    ui.showAnswerFeedback(selectedAnswer, currentCorrectAnswer);
    renderStats();
  }

  // Advances from answered feedback to the next available letter in the current round.
  // Called by the UI next-letter callback and the correct-answer timer.
  function handleLetterNext() {
    if (!hasAnswered) {
      return;
    }

    clearAutoNextTimer();
    currentLetterIndex += 1;
    showCurrentLetter();
  }

  // Initializes URL settings, dataset, PRNG, storage state, UI callbacks, and first round.
  // Called only by app.js after the DOM is ready.
  function init() {
    const settings = random.ensureUrlSettings(
      data.datasets[0].id,
      // Extracts valid dataset ids for URL validation.
      // Called only by Array.map in init.
      data.datasets.map((dataset) => dataset.id)
    );

    seed = settings.seed;
    dataSetId = settings.dataSetId;
    // Finds the active dataset selected by the normalized URL parameter.
    // Called only by Array.find in init.
    currentDataSet = data.datasets.find((dataset) => dataset.id === dataSetId);
    nextRandom = random.createSeededRandom(seed);
    recentCorrectLetters = storage.getRecentCorrectLetters().slice(-RECENT_CORRECT_LETTER_LIMIT);

    ui.init({
      onAnswer: handleAnswer,
      onLetterNext: handleLetterNext,
      onRoundNext: startRound,
      onDataSetChange: random.switchDataSet,
      onReset: handleReset
    });

    ui.renderDataSetSwitcher(data.datasets, dataSetId);
    startRound();
  }

  window.CyrillicGame = {
    init
  };
}());
