(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const urlSettings = window.CyrillicUrlSettings;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicUI;
  const CurrentWordState = window.CurrentWordState;
  const WRONG_ANSWER_OPTION_COUNT = 5;
  const GAME_MODES = [
    { id: "1", title: "Cyrilic → Latin" },
    { id: "2", title: "Latin → Cyrilic" }
  ];
  const CYRILIC_TO_LATIN_MODE_ID = "1";
  const LATIN_TO_CYRILIC_MODE_ID = "2";
  const DEFAULT_FRONT_PAGE_DATA_SET_ID = "2";

  // Game context is the URL-selected setup for this page load; it is recreated on navigation and not persisted.
  let gameContext = null;
  let nextRandom = null;
  let currentWordState = null;
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

  function continueCurrentWordRound() {
    if (!currentWordState.skipRecentlyCorrectLetters(userProgressStats)) {
      ui.showRoundDone(currentWordState.word, { retryWord: gameState.currentWordHadWrongAnswer });
      ui.renderStats(getStats(), gameContext.seed);
      return;
    }

    showCurrentQuestion();
  }

  function showCurrentQuestion() {
    const currentLetter = currentWordState.getCurrentLetter();
    const letterTransliteration = getTransliterationForLetter(currentLetter);
    currentWordState.startQuestion(getCorrectAnswer(letterTransliteration));
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

    const word = gameContext.selectedDataSet.wordSource[gameState.currentWordIndex];
    nextRandom = random.createSeededRandom(`${gameContext.seed}:${gameContext.dataSetId}:${gameContext.gameModeId}:${gameState.roundCounter}:${gameState.currentWordIndex}`);
    gameState.currentWordHadWrongAnswer = false;
    currentWordState = new CurrentWordState(word, getWordLetters(word).map(chooseQuestionLetter));
    saveAppState();
    continueCurrentWordRound();
  }

  function clearProgressAndGoToFrontPage() {
    storage.clear();
    urlSettings.goToFrontPage();
  }

  function handleHomeStart(settings) {
    storage.clear();
    urlSettings.startGame(settings);
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
    if (currentWordState.hasAnsweredQuestion()) {
      return;
    }

    currentWordState.markQuestionAnswered();
    const currentLetter = currentWordState.getCurrentLetter();
    const isCorrectAnswer = currentWordState.isAnswerCorrect(selectedAnswer);

    if (isCorrectAnswer) {
      userProgressStats.recordCorrectLetter(currentLetter);
    } else {
      gameState.currentWordHadWrongAnswer = true;
      userProgressStats.recordWrongLetter(currentLetter);
    }

    saveAppState();
    ui.showAnswerFeedback(selectedAnswer, currentWordState.getCorrectAnswer(), {
      autoNext: isCorrectAnswer,
      onAutoNext: handleLetterNext
    });
    ui.renderStats(getStats(), gameContext.seed);
  }

  function handleLetterNext() {
    if (!currentWordState.hasAnsweredQuestion()) {
      return;
    }

    currentWordState.advanceLetter();
    continueCurrentWordRound();
  }

  function init() {
    ui.init({
      onAnswer: handleAnswer,
      onLetterNext: handleLetterNext,
      onRoundNext: handleRoundNext,
      onHomeStart: handleHomeStart,
      onHomeRandomGame: urlSettings.createSeed,
      onShowProgress: () => ui.showProgress(userProgressStats.getLetterErrorCounts()),
      onNewGame: clearProgressAndGoToFrontPage
    });

    if (urlSettings.isFrontPage()) {
      const defaultFrontPageDataSet = data.datasets.some((dataset) => dataset.id === DEFAULT_FRONT_PAGE_DATA_SET_ID)
        ? DEFAULT_FRONT_PAGE_DATA_SET_ID
        : data.datasets[0].id;

      ui.renderHome(data.datasets, GAME_MODES, {
        seed: urlSettings.createSeed(),
        dataSetId: defaultFrontPageDataSet,
        gameModeId: CYRILIC_TO_LATIN_MODE_ID
      });
      ui.showFrontPage();
      return;
    }

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
    ui.showGameShell();
    startRound();
  }

  window.CyrillicGame = {
    init
  };
}());
