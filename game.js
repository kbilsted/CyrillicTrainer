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

  function clearAutoNextTimer() {
    if (autoNextTimer !== null) {
      window.clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function getTransliterationForLetter(cyrillicLetter) {
    const match = data.letterTransliterations.find((letter) => letter.cyrillic === cyrillicLetter);

    if (!match) {
      throw new Error(`Missing transliteration for ${cyrillicLetter}`);
    }

    return match;
  }

  function isTrainableLetter(letter) {
    return data.letterTransliterations.some((item) => item.cyrillic === letter);
  }

  function getQuestionLetterVariants(letter) {
    const lowerLetter = letter.toLowerCase();
    const upperLetter = letter.toUpperCase();

    return [lowerLetter, upperLetter].filter((variant, index, variants) => (
      isTrainableLetter(variant)
      && variants.indexOf(variant) === index
    ));
  }

  function getWordLetters(word) {
    return Array.from(word.cyrillic).filter(isTrainableLetter);
  }

  function chooseQuestionLetter(letter) {
    const variants = getQuestionLetterVariants(letter);
    const availableVariants = variants.filter((variant) => !wasRecentlyCorrect(variant));

    return random.choose(
      nextRandom,
      availableVariants.length > 0 ? availableVariants : variants
    );
  }

  function wasRecentlyCorrect(letter) {
    return recentCorrectLetters.includes(letter);
  }

  function rememberCorrectLetter(letter) {
    recentCorrectLetters.push(letter);

    if (recentCorrectLetters.length > RECENT_CORRECT_LETTER_LIMIT) {
      recentCorrectLetters = recentCorrectLetters.slice(-RECENT_CORRECT_LETTER_LIMIT);
    }

    storage.setRecentCorrectLetters(recentCorrectLetters);
  }

  function getRoundCandidateWords() {
    const wordsWithAskableLetters = currentDataSet.wordSource.filter((word) => (
      getWordLetters(word)
        .flatMap(getQuestionLetterVariants)
        .some((letter) => !wasRecentlyCorrect(letter))
    ));

    return wordsWithAskableLetters.length > 0 ? wordsWithAskableLetters : currentDataSet.wordSource;
  }

  function chooseRoundWord(preferredLetter) {
    const candidateWords = getRoundCandidateWords();

    if (preferredLetter !== null) {
      const normalizedPreferredLetter = preferredLetter.toLowerCase();
      const preferredWords = candidateWords.filter((word) => (
        getWordLetters(word).some((letter) => letter.toLowerCase() === normalizedPreferredLetter)
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

  function chooseOptions(letterTransliteration) {
    const correctAnswer = letterTransliteration.latin;
    const isUppercaseLetter = letterTransliteration.cyrillic === letterTransliteration.cyrillic.toUpperCase();
    const letterOptions = data.letterOptions.map((option) => (
      isUppercaseLetter ? option.toUpperCase() : option
    ));
    const mustAskChoices = (letterTransliteration.mustAsk || [])
      .filter((option, index, options) => (
        option !== correctAnswer
        && letterOptions.includes(option)
        && options.indexOf(option) === index
      ))
      .slice(0, 4);
    const wrongChoices = letterOptions.filter((option) => option !== correctAnswer);
    const extraWrongChoices = wrongChoices.filter((option) => !mustAskChoices.includes(option));
    const shuffledExtraWrongChoices = random.shuffleSeeded(nextRandom, extraWrongChoices);
    const selectedWrongChoices = mustAskChoices
      .concat(shuffledExtraWrongChoices)
      .slice(0, WRONG_ANSWER_OPTION_COUNT);

    return random.shuffleSeeded(nextRandom, selectedWrongChoices.concat(correctAnswer));
  }

  function moveToNextAvailableLetter() {
    while (
      currentLetterIndex < currentLetters.length
      && wasRecentlyCorrect(currentLetters[currentLetterIndex])
    ) {
      currentLetterIndex += 1;
    }

    return currentLetterIndex < currentLetters.length;
  }

  function showCurrentLetter() {
    clearAutoNextTimer();

    if (!moveToNextAvailableLetter()) {
      ui.showRoundDone(currentWord);
      ui.renderStats(storage.getStats(), seed);
      return;
    }

    const currentLetter = currentLetters[currentLetterIndex];
    const letterTransliteration = getTransliterationForLetter(currentLetter);
    currentCorrectAnswer = letterTransliteration.latin;
    hasAnswered = false;
    ui.showLetterGuess(currentLetter, chooseOptions(letterTransliteration));
    ui.renderStats(storage.getStats(), seed);
  }

  function startRound() {
    clearAutoNextTimer();
    storage.incrementRound();
    const preferredLetter = lastWrongAnswer;
    currentWord = chooseRoundWord(preferredLetter);
    lastWrongAnswer = null;
    currentLetters = getWordLetters(currentWord).map(chooseQuestionLetter);
    currentLetterIndex = 0;
    showCurrentLetter();
  }

  function handleReset() {
    clearAutoNextTimer();
    storage.resetProgress();
    recentCorrectLetters = [];
    lastWrongAnswer = null;
    startRound();
  }

  function handleAnswer(selectedAnswer) {
    if (hasAnswered) {
      return;
    }

    hasAnswered = true;

    if (selectedAnswer === currentCorrectAnswer) {
      rememberCorrectLetter(currentLetters[currentLetterIndex]);
      storage.incrementSuccess();
      autoNextTimer = window.setTimeout(() => {
        autoNextTimer = null;
        handleLetterNext();
      }, CORRECT_ANSWER_AUTO_NEXT_DELAY_MS);
    } else {
      lastWrongAnswer = currentLetters[currentLetterIndex];
      storage.incrementFail();
    }

    ui.showAnswerFeedback(selectedAnswer, currentCorrectAnswer);
    ui.renderStats(storage.getStats(), seed);
  }

  function handleLetterNext() {
    if (!hasAnswered) {
      return;
    }

    clearAutoNextTimer();
    currentLetterIndex += 1;
    showCurrentLetter();
  }

  function init() {
    const settings = random.ensureUrlSettings(
      data.datasets[0].id,
      data.datasets.map((dataset) => dataset.id)
    );

    seed = settings.seed;
    dataSetId = settings.dataSetId;
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
