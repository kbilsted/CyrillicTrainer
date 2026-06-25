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

  // Game context is the URL-selected setup for this page load; it is recreated on navigation and not persisted.
  let gameContext = null;
  let nextRandom = null;
  let currentWord = null;
  let currentLetters = [];
  let currentLetterIndex = 0;
  let currentCorrectAnswer = null;
  let isCurrentQuestionAnswered = false;
  let userProgressStats = null;
  let gameState = null;

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

  function saveAppState() {
    storage.save({
      userProgressStats,
      gameState
    });
  }

  function getStats() {
    return {
      ...userProgressStats.getStats(),
      roundCounter: gameState.roundCounter
    };
  }

  function isWordAskable(word) {
    return getWordLetters(word)
      .flatMap(getQuestionLetterVariants)
      .some((letter) => !userProgressStats.wasRecentlyCorrect(letter));
  }

  function createWordOrder() {
    const wordIndexes = gameContext.selectedDataSet.wordSource.map((_, index) => index);
    return random.shuffleSeeded(
      random.createSeededRandom(`${gameContext.seed}:${gameContext.dataSetId}:wordOrder`),
      wordIndexes
    );
  }

  function findNextWordIndex() {
    while (gameState.wordCursor < gameState.wordOrder.length) {
      const nextWordIndex = gameState.wordOrder[gameState.wordCursor];
      gameState.wordCursor += 1;

      if (isWordAskable(gameContext.selectedDataSet.wordSource[nextWordIndex])) {
        return nextWordIndex;
      }
    }

    return null;
  }

  function chooseOptions(letterTransliteration) {
    if (gameContext.gameModeId === LATIN_TO_CYRILIC_MODE_ID) {
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
    return gameContext.gameModeId === LATIN_TO_CYRILIC_MODE_ID
      ? letterTransliteration.latin
      : letterTransliteration.cyrillic;
  }

  function getCorrectAnswer(letterTransliteration) {
    return gameContext.gameModeId === LATIN_TO_CYRILIC_MODE_ID
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
      ui.showRoundDone(currentWord, { retryWord: gameState.currentWordHadWrongAnswer });
      ui.renderStats(getStats(), gameContext.seed);
      return;
    }

    const currentLetter = currentLetters[currentLetterIndex];
    const letterTransliteration = getTransliterationForLetter(currentLetter);
    currentCorrectAnswer = getCorrectAnswer(letterTransliteration);
    isCurrentQuestionAnswered = false;
    ui.showLetterGuess(
      GAME_MODES.find((mode) => mode.id === gameContext.gameModeId).title,
      getQuestionPrompt(letterTransliteration),
      chooseOptions(letterTransliteration)
    );
    ui.renderStats(getStats(), gameContext.seed);
  }

  function showGameOver() {
    gameState.gameOver = true;
    saveAppState();
    ui.showGameOver(getStats(), userProgressStats.getLetterErrorCounts());
    ui.renderStats(getStats(), gameContext.seed);
  }

  function startRound() {
    if (gameState.gameOver) {
      ui.showGameOver(getStats(), userProgressStats.getLetterErrorCounts());
      ui.renderStats(getStats(), gameContext.seed);
      return;
    }

    if (gameState.currentWordIndex === null) {
      gameState.currentWordIndex = findNextWordIndex();
    }

    if (gameState.currentWordIndex === null) {
      showGameOver();
      return;
    }

    currentWord = gameContext.selectedDataSet.wordSource[gameState.currentWordIndex];
    nextRandom = random.createSeededRandom(`${gameContext.seed}:${gameContext.dataSetId}:${gameContext.gameModeId}:${gameState.roundCounter}:${gameState.currentWordIndex}`);
    gameState.currentWordHadWrongAnswer = false;
    currentLetters = getWordLetters(currentWord).map(chooseQuestionLetter);
    currentLetterIndex = 0;
    saveAppState();
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
    gameState.reset(createWordOrder());
    saveAppState();
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
    if (gameState.currentWordHadWrongAnswer) {
      gameState.roundCounter += 1;
      gameState.currentWordHadWrongAnswer = false;
      saveAppState();
      startRound();
      return;
    }

    gameState.currentWordIndex = findNextWordIndex();
    if (gameState.currentWordIndex === null) {
      showGameOver();
      return;
    }

    gameState.roundCounter += 1;
    saveAppState();
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
      gameState.currentWordHadWrongAnswer = true;
      userProgressStats.recordWrongLetter(currentLetters[currentLetterIndex]);
    }

    saveAppState();
    ui.showAnswerFeedback(selectedAnswer, currentCorrectAnswer, {
      autoNext: selectedAnswer === currentCorrectAnswer,
      onAutoNext: handleLetterNext
    });
    ui.renderStats(getStats(), gameContext.seed);
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

    gameContext = {
      seed: settings.seed,
      dataSetId: settings.dataSetId,
      gameModeId: settings.gameModeId,
      selectedDataSet: data.datasets.find((dataset) => dataset.id === settings.dataSetId)
    };
    const persistedState = storage.load();
    userProgressStats = persistedState.userProgressStats;
    gameState = persistedState.gameState;
    gameState.setWordOrder(createWordOrder(), gameContext.selectedDataSet.wordSource.length);
    saveAppState();

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

    ui.renderDataSetSwitcher(data.datasets, gameContext.dataSetId);
    ui.renderGameModeSwitcher(GAME_MODES, gameContext.gameModeId);
    startRound();
  }

  window.CyrillicGame = {
    init
  };
}());
