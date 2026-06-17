(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicUI;
  const CORRECT_ANSWER_AUTO_NEXT_DELAY_MS = 900;

  let seed = null;
  let nextRandom = null;
  let currentWord = null;
  let currentLetters = [];
  let currentLetterIndex = 0;
  let currentCorrectAnswer = null;
  let hasAnswered = false;
  let autoNextTimer = null;

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

  function chooseOptions(correctAnswer) {
    const wrongChoices = data.letterOptions.filter((option) => option !== correctAnswer);
    const shuffledWrongChoices = random.shuffleSeeded(nextRandom, wrongChoices);
    return random.insertAtUnseeded(shuffledWrongChoices.slice(0, 4), correctAnswer);
  }

  function renderStats() {
    ui.renderStats(storage.getStats(), seed);
  }

  function showCurrentLetter() {
    clearAutoNextTimer();
    const currentLetter = currentLetters[currentLetterIndex];
    currentCorrectAnswer = getLatinForLetter(currentLetter);
    hasAnswered = false;
    ui.showLetterGuess(currentLetter, chooseOptions(currentCorrectAnswer));
    renderStats();
  }

  function startRound() {
    clearAutoNextTimer();
    storage.incrementRound();
    currentWord = random.choose(nextRandom, data.wordSource);
    currentLetters = Array.from(currentWord.cyrillic);
    currentLetterIndex = 0;
    showCurrentLetter();
  }

  function handleAnswer(selectedAnswer) {
    if (hasAnswered) {
      return;
    }

    hasAnswered = true;

    if (selectedAnswer === currentCorrectAnswer) {
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

    if (currentLetterIndex >= currentLetters.length) {
      ui.showRoundDone(currentWord);
      renderStats();
      return;
    }

    showCurrentLetter();
  }

  function init() {
    seed = random.ensureSeed();
    nextRandom = random.createSeededRandom(seed);

    ui.init({
      onAnswer: handleAnswer,
      onLetterNext: handleLetterNext,
      onRoundNext: startRound
    });

    startRound();
  }

  window.CyrillicGame = {
    init
  };
}());
