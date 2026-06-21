(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicUI;
  const CORRECT_ANSWER_AUTO_NEXT_DELAY_MS = 500;
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

  function clearAutoNextTimer() {
    if (autoNextTimer !== null) {
      window.clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function getLatinForLetter(cyrillicLetter) {
    const match = data.letterTransliterations.find((letter) => letter.cyrillic === cyrillicLetter);

    if (!match) {
      throw new Error(`Missing transliteration for ${cyrillicLetter}`);
    }

    return match.latin;
  }

  function isTrainableLetter(letter) {
    return data.letterTransliterations.some((item) => item.cyrillic === letter);
  }

  function getTrainableLetters(word) {
    return Array.from(word.cyrillic).filter(isTrainableLetter);
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

  function chooseRoundWord() {
    const availableWords = currentDataSet.wordSource.filter((word) => (
      getTrainableLetters(word).some((letter) => !wasRecentlyCorrect(letter))
    ));

    return random.choose(
      nextRandom,
      availableWords.length > 0 ? availableWords : currentDataSet.wordSource
    );
  }

  function chooseOptions(correctAnswer) {
    const wrongChoices = data.letterOptions.filter((option) => option !== correctAnswer);
    const shuffledWrongChoices = random.shuffleSeeded(nextRandom, wrongChoices);
    return random.insertAtUnseeded(shuffledWrongChoices.slice(0, 4), correctAnswer);
  }

  function renderStats() {
    ui.renderStats(storage.getStats(), seed);
  }

  function showRoundDone() {
    ui.showRoundDone(currentWord);
    renderStats();
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
      showRoundDone();
      return;
    }

    const currentLetter = currentLetters[currentLetterIndex];
    currentCorrectAnswer = getLatinForLetter(currentLetter);
    hasAnswered = false;
    ui.showLetterGuess(currentLetter, chooseOptions(currentCorrectAnswer));
    renderStats();
  }

  function startRound() {
    clearAutoNextTimer();
    storage.incrementRound();
    currentWord = chooseRoundWord();
    currentLetters = getTrainableLetters(currentWord);
    currentLetterIndex = 0;
    showCurrentLetter();
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
      storage.incrementFail();
    }

    ui.showAnswerFeedback(selectedAnswer, currentCorrectAnswer);
    renderStats();
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
      onDataSetChange: random.switchDataSet
    });

    ui.renderDataSetSwitcher(data.datasets, dataSetId);
    startRound();
  }

  window.CyrillicGame = {
    init
  };
}());
