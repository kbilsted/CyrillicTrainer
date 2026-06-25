(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const urlSettings = window.CyrillicUrlSettings;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicUI;
  const WRONG_ANSWER_OPTION_COUNT = 5;
  const GAME_MODES = [
    { id: "1", title: "Cyrilic → Latin" },
    { id: "2", title: "Latin → Cyrilic" }
  ];
  const CYRILIC_TO_LATIN_MODE_ID = "1";
  const LATIN_TO_CYRILIC_MODE_ID = "2";

  let seed = null;
  let dataSetId = null;
  let gameModeId = null;
  let currentDataSet = null;
  let nextRandom = null;
  let currentWord = null;
  let currentLetters = [];
  let currentLetterIndex = 0;
  let currentCorrectAnswer = null;
  let isCurrentQuestionAnswered = false;
  let userProgressStats = null;
  let roundCounter = 0;
  let wordOrder = [];
  let wordCursor = 0;
  let currentWordIndex = null;
  let currentWordHadWrongAnswer = false;
  let gameOver = false;

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
    const availableVariants = variants.filter((variant) => !userProgressStats.wasRecentlyCorrect(variant));

    return random.choose(
      nextRandom,
      availableVariants.length > 0 ? availableVariants : variants
    );
  }

  function saveGameState() {
    storage.save({
      userProgressStats,
      roundCounter,
      wordCursor,
      currentWordIndex,
      currentWordHadWrongAnswer,
      gameOver
    });
  }

  function getStats() {
    return {
      ...userProgressStats.getStats(),
      roundCounter
    };
  }

  function isWordAskable(word) {
    return getWordLetters(word)
      .flatMap(getQuestionLetterVariants)
      .some((letter) => !userProgressStats.wasRecentlyCorrect(letter));
  }

  function createWordOrder() {
    const wordIndexes = currentDataSet.wordSource.map((_, index) => index);
    return random.shuffleSeeded(
      random.createSeededRandom(`${seed}:${dataSetId}:wordOrder`),
      wordIndexes
    );
  }

  function findNextWordIndex() {
    while (wordCursor < wordOrder.length) {
      const nextWordIndex = wordOrder[wordCursor];
      wordCursor += 1;

      if (isWordAskable(currentDataSet.wordSource[nextWordIndex])) {
        return nextWordIndex;
      }
    }

    return null;
  }

  function chooseOptions(letterTransliteration) {
    if (gameModeId === LATIN_TO_CYRILIC_MODE_ID) {
      return chooseCyrillicOptions(letterTransliteration);
    }

    return chooseLatinOptions(letterTransliteration);
  }

  function chooseLatinOptions(letterTransliteration) {
    const correctAnswer = letterTransliteration.latin;
    const isUppercaseLetter = letterTransliteration.cyrillic === letterTransliteration.cyrillic.toUpperCase();
    const letterOptions = data.letterOptions.map((option) => (
      isUppercaseLetter ? option.toUpperCase() : option
    ));
    const mustAskChoices = (letterTransliteration.cyrillicToLatinMustAsk || [])
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

  function chooseCyrillicOptions(letterTransliteration) {
    const correctAnswer = letterTransliteration.cyrillic;
    const isUppercaseLetter = letterTransliteration.cyrillic === letterTransliteration.cyrillic.toUpperCase();
    const cyrillicOptions = data.letterTransliterations
      .filter((entry) => (
        isUppercaseLetter
          ? entry.cyrillic === entry.cyrillic.toUpperCase()
          : entry.cyrillic === entry.cyrillic.toLowerCase()
      ))
      .map((entry) => entry.cyrillic);
    const mustAskChoices = (letterTransliteration.latinToCyrillicMustAsk || [])
      .filter((option, index, options) => (
        option !== correctAnswer
        && cyrillicOptions.includes(option)
        && options.indexOf(option) === index
      ))
      .slice(0, 4);
    const wrongChoices = cyrillicOptions.filter((option) => option !== correctAnswer);
    const extraWrongChoices = wrongChoices.filter((option) => !mustAskChoices.includes(option));
    const shuffledExtraWrongChoices = random.shuffleSeeded(nextRandom, extraWrongChoices);
    const selectedWrongChoices = mustAskChoices
      .concat(shuffledExtraWrongChoices)
      .slice(0, WRONG_ANSWER_OPTION_COUNT);

    return random.shuffleSeeded(nextRandom, selectedWrongChoices.concat(correctAnswer));
  }

  function getQuestionPrompt(letterTransliteration) {
    return gameModeId === LATIN_TO_CYRILIC_MODE_ID
      ? letterTransliteration.latin
      : letterTransliteration.cyrillic;
  }

  function getCorrectAnswer(letterTransliteration) {
    return gameModeId === LATIN_TO_CYRILIC_MODE_ID
      ? letterTransliteration.cyrillic
      : letterTransliteration.latin;
  }

  function moveToNextAvailableLetter() {
    while (
      currentLetterIndex < currentLetters.length
      && userProgressStats.wasRecentlyCorrect(currentLetters[currentLetterIndex])
    ) {
      currentLetterIndex += 1;
    }

    return currentLetterIndex < currentLetters.length;
  }

  function showCurrentLetter() {
    if (!moveToNextAvailableLetter()) {
      ui.showRoundDone(currentWord, { retryWord: currentWordHadWrongAnswer });
      ui.renderStats(getStats(), seed);
      return;
    }

    const currentLetter = currentLetters[currentLetterIndex];
    const letterTransliteration = getTransliterationForLetter(currentLetter);
    currentCorrectAnswer = getCorrectAnswer(letterTransliteration);
    isCurrentQuestionAnswered = false;
    ui.showLetterGuess(
      GAME_MODES.find((mode) => mode.id === gameModeId).title,
      getQuestionPrompt(letterTransliteration),
      chooseOptions(letterTransliteration)
    );
    ui.renderStats(getStats(), seed);
  }

  function showGameOver() {
    gameOver = true;
    saveGameState();
    ui.showGameOver(getStats(), userProgressStats.getLetterErrorCounts());
    ui.renderStats(getStats(), seed);
  }

  function startRound() {
    if (gameOver) {
      ui.showGameOver(getStats(), userProgressStats.getLetterErrorCounts());
      ui.renderStats(getStats(), seed);
      return;
    }

    if (currentWordIndex === null) {
      currentWordIndex = findNextWordIndex();
    }

    if (currentWordIndex === null) {
      showGameOver();
      return;
    }

    currentWord = currentDataSet.wordSource[currentWordIndex];
    nextRandom = random.createSeededRandom(`${seed}:${dataSetId}:${gameModeId}:${roundCounter}:${currentWordIndex}`);
    currentWordHadWrongAnswer = false;
    currentLetters = getWordLetters(currentWord).map(chooseQuestionLetter);
    currentLetterIndex = 0;
    saveGameState();
    showCurrentLetter();
  }

  function handleReset() {
    resetGameFlow();
    startRound();
  }

  function handleGameModeChange(nextGameModeId) {
    resetGameFlow();
    urlSettings.switchGameMode(nextGameModeId);
  }

  function resetGameFlow() {
    userProgressStats.reset();
    roundCounter = 1;
    wordCursor = 0;
    currentWordIndex = null;
    currentWordHadWrongAnswer = false;
    gameOver = false;
    saveGameState();
  }

  function handleDataSetChange(nextDataSetId) {
    resetGameFlow();
    urlSettings.switchDataSet(nextDataSetId);
  }

  function handleSeedChange(nextSeed) {
    resetGameFlow();
    urlSettings.switchSeed(nextSeed);
  }

  function handleNewGame() {
    resetGameFlow();
    urlSettings.startNewGame();
  }

  function handleRoundNext() {
    if (currentWordHadWrongAnswer) {
      roundCounter += 1;
      currentWordHadWrongAnswer = false;
      saveGameState();
      startRound();
      return;
    }

    currentWordIndex = findNextWordIndex();
    if (currentWordIndex === null) {
      showGameOver();
      return;
    }

    roundCounter += 1;
    saveGameState();
    startRound();
  }

  function handleAnswer(selectedAnswer) {
    if (isCurrentQuestionAnswered) {
      return;
    }

    isCurrentQuestionAnswered = true;

    if (selectedAnswer === currentCorrectAnswer) {
      userProgressStats.recordCorrectLetter(currentLetters[currentLetterIndex]);
    } else {
      currentWordHadWrongAnswer = true;
      userProgressStats.recordWrongLetter(currentLetters[currentLetterIndex]);
    }

    saveGameState();
    ui.showAnswerFeedback(selectedAnswer, currentCorrectAnswer, {
      autoNext: selectedAnswer === currentCorrectAnswer,
      onAutoNext: handleLetterNext
    });
    ui.renderStats(getStats(), seed);
  }

  function handleLetterNext() {
    if (!isCurrentQuestionAnswered) {
      return;
    }

    currentLetterIndex += 1;
    showCurrentLetter();
  }

  function init() {
    const settings = urlSettings.ensureUrlSettings(
      data.datasets[0].id,
      data.datasets.map((dataset) => dataset.id),
      CYRILIC_TO_LATIN_MODE_ID,
      GAME_MODES.map((mode) => mode.id)
    );

    seed = settings.seed;
    dataSetId = settings.dataSetId;
    gameModeId = settings.gameModeId;
    currentDataSet = data.datasets.find((dataset) => dataset.id === dataSetId);
    wordOrder = createWordOrder();
    const persistedState = storage.load();
    userProgressStats = persistedState.userProgressStats;
    roundCounter = persistedState.roundCounter || 1;
    wordCursor = Math.min(persistedState.wordCursor || 0, wordOrder.length);
    currentWordIndex = (
      Number.isInteger(persistedState.currentWordIndex)
      && persistedState.currentWordIndex >= 0
      && persistedState.currentWordIndex < currentDataSet.wordSource.length
    ) ? persistedState.currentWordIndex : null;
    currentWordHadWrongAnswer = persistedState.currentWordHadWrongAnswer;
    gameOver = persistedState.gameOver;
    saveGameState();

    ui.init({
      onAnswer: handleAnswer,
      onLetterNext: handleLetterNext,
      onRoundNext: handleRoundNext,
      onDataSetChange: handleDataSetChange,
      onSeedChange: handleSeedChange,
      onGameModeChange: handleGameModeChange,
      onShowProgress: () => ui.showProgress(userProgressStats.getLetterErrorCounts()),
      onReset: handleReset,
      onNewGame: handleNewGame
    });

    ui.renderDataSetSwitcher(data.datasets, dataSetId);
    ui.renderGameModeSwitcher(GAME_MODES, gameModeId);
    startRound();
  }

  window.CyrillicGame = {
    init
  };
}());
