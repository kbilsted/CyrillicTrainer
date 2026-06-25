(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const urlSettings = window.CyrillicUrlSettings;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicUI;
  const questionFactory = window.CyrillicQuestionFactory;
  const CurrentWordState = window.CurrentWordState;
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

  function isTrainableLetter(letter) {
    return data.letterTransliterations.some((item) => item.cyrillic === letter);
  }

  function getTrainableCaseVariants(letter) {
    const lowerLetter = letter.toLowerCase();
    const upperLetter = letter.toUpperCase();

    return [lowerLetter, upperLetter].filter((variant, index, variants) => (
      isTrainableLetter(variant)
      && variants.indexOf(variant) === index
    ));
  }

  function getTrainableWordLetters(word) {
    return Array.from(word.cyrillic).filter(isTrainableLetter);
  }

  function chooseQuestionLetterVariant(letter) {
    const variants = getTrainableCaseVariants(letter);
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

  function getDisplayStats() {
    return {
      ...userProgressStats.getDisplayStats(),
      roundCounter: gameState.roundCounter
    };
  }

  function isWordAskable(word) {
    return getTrainableWordLetters(word)
      .flatMap(getTrainableCaseVariants)
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

  function advanceCurrentWordRound() {
    if (!currentWordState.skipRecentlyCorrectLetters(userProgressStats)) {
      ui.showRoundDone(currentWordState.word, { retryWord: gameState.currentWordHadWrongAnswer });
      ui.renderStats(getDisplayStats(), gameContext.seed);
      return;
    }

    showCurrentQuestion();
  }

  function showCurrentQuestion() {
    const currentLetter = currentWordState.getCurrentLetter();
    const letterTransliteration = questionFactory.getTransliterationForLetter(data.letterTransliterations, currentLetter);
    const question = questionFactory.createQuestion({
      gameModeId: gameContext.gameModeId,
      latinToCyrillicModeId: LATIN_TO_CYRILIC_MODE_ID,
      letterOptions: data.letterOptions,
      letterTransliterations: data.letterTransliterations,
      letterTransliteration,
      random,
      nextRandom
    });

    currentWordState.setCurrentQuestionAnswer(question.correctAnswer);
    ui.showLetterGuess(
      GAME_MODES.find((mode) => mode.id === gameContext.gameModeId).title,
      question.prompt,
      question.options
    );
    ui.renderStats(getDisplayStats(), gameContext.seed);
  }

  function showGameOver() {
    gameState.gameOver = true;
    saveAppState();
    ui.showGameOver(getDisplayStats(), userProgressStats.getLetterErrorCounts());
    ui.renderStats(getDisplayStats(), gameContext.seed);
  }

  function startCurrentWordRound() {
    if (gameState.gameOver) {
      ui.showGameOver(getDisplayStats(), userProgressStats.getLetterErrorCounts());
      ui.renderStats(getDisplayStats(), gameContext.seed);
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
    currentWordState = new CurrentWordState(word, getTrainableWordLetters(word).map(chooseQuestionLetterVariant));
    saveAppState();
    advanceCurrentWordRound();
  }

  function clearProgressAndGoToFrontPage() {
    storage.clear();
    urlSettings.goToFrontPage();
  }

  function handleStartGameFromFrontPage(settings) {
    storage.clear();
    urlSettings.startGame(settings);
  }

  function handleRoundNext() {
    if (gameState.currentWordHadWrongAnswer) {
      gameState.roundCounter += 1;
      gameState.currentWordHadWrongAnswer = false;
      saveAppState();
      startCurrentWordRound();
      return;
    }

    gameState.currentWordIndex = findNextWordIndex();
    if (gameState.currentWordIndex === null) {
      showGameOver();
      return;
    }

    gameState.roundCounter += 1;
    saveAppState();
    startCurrentWordRound();
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
      onAutoNext: handleQuestionNext
    });
    ui.renderStats(getDisplayStats(), gameContext.seed);
  }

  function handleQuestionNext() {
    if (!currentWordState.hasAnsweredQuestion()) {
      return;
    }

    currentWordState.advanceToNextLetter();
    advanceCurrentWordRound();
  }

  function init() {
    ui.init({
      onAnswer: handleAnswer,
      onLetterNext: handleQuestionNext,
      onRoundNext: handleRoundNext,
      onHomeStart: handleStartGameFromFrontPage,
      onHomeRandomGame: urlSettings.createSeed,
      onShowProgress: () => ui.showProgress(userProgressStats.getLetterErrorCounts()),
      onNewGame: clearProgressAndGoToFrontPage
    });

    if (urlSettings.isFrontPage()) {
      const defaultFrontPageDataSet = data.datasets.some((dataset) => dataset.id === DEFAULT_FRONT_PAGE_DATA_SET_ID)
        ? DEFAULT_FRONT_PAGE_DATA_SET_ID
        : data.datasets[0].id;

      ui.renderFrontPageControls(data.datasets, GAME_MODES, {
        seed: urlSettings.createSeed(),
        dataSetId: defaultFrontPageDataSet,
        gameModeId: CYRILIC_TO_LATIN_MODE_ID
      });
      ui.showFrontPage();
      return;
    }

    const settings = urlSettings.normalizeGameUrlSettings(
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
    startCurrentWordRound();
  }

  window.CyrillicGame = {
    init
  };
}());
