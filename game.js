(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const random = window.CyrillicRandom;
  const urlSettings = window.CyrillicUrlSettings;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicGameUI;
  const questionFactory = window.CyrillicQuestionFactory;
  const trainingLetters = window.CyrillicTrainingLetters;
  const wordScheduler = window.CyrillicWordScheduler;
  const CurrentWordState = window.CurrentWordState;
  const GAME_MODES = [
    { id: "1", title: "Cyrilic → Latin" },
    { id: "2", title: "Latin → Cyrilic" }
  ];
  const CYRILIC_TO_LATIN_MODE_ID = "1";
  const LATIN_TO_CYRILIC_MODE_ID = "2";
  const TIMER_TICK_MS = 250;

  // Game context is the URL-selected setup for this page load; it is recreated on navigation and not persisted.
  let gameContext = null;
  let nextRandom = null;
  let currentWordState = null;
  let userProgressStats = null;
  let gameState = null;
  let timerStartedAtMs = null;
  let timerPausedAtMs = null;
  let timerPausedTotalMs = 0;
  let timerInterval = null;

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

  function getStatisticsPayload() {
    return {
      stats: getDisplayStats(),
      letterCorrectCounts: userProgressStats.getLetterCorrectCounts(),
      letterErrorCounts: userProgressStats.getLetterErrorCounts()
    };
  }

  function getRemainingSeconds() {
    if (gameContext === null || timerStartedAtMs === null) {
      return 0;
    }

    const now = timerPausedAtMs === null ? Date.now() : timerPausedAtMs;
    const elapsedMs = Math.max(0, now - timerStartedAtMs - timerPausedTotalMs);
    const remainingMs = Math.max(0, (gameContext.durationSeconds * 1000) - elapsedMs);

    return Math.ceil(remainingMs / 1000);
  }

  function renderTimer() {
    ui.renderTimer({
      remainingSeconds: getRemainingSeconds()
    });
  }

  function startTimer() {
    timerStartedAtMs = Date.now();
    timerPausedAtMs = null;
    timerPausedTotalMs = 0;
    renderTimer();
    timerInterval = window.setInterval(renderTimer, TIMER_TICK_MS);
  }

  function pauseTimer() {
    if (timerPausedAtMs === null && !gameState.gameOver) {
      timerPausedAtMs = Date.now();
      renderTimer();
    }
  }

  function resumeTimer() {
    if (timerPausedAtMs !== null && !gameState.gameOver) {
      timerPausedTotalMs += Date.now() - timerPausedAtMs;
      timerPausedAtMs = null;
      renderTimer();
    }
  }

  function stopTimer() {
    if (timerInterval !== null) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
    timerPausedAtMs = null;
    renderTimer();
  }

  function isTimeExpired() {
    return getRemainingSeconds() <= 0;
  }

  function advanceCurrentWordRound() {
    if (!currentWordState.skipRecentlyCorrectLetters(userProgressStats)) {
      if (isTimeExpired()) {
        showGameOver({ timeExpired: true });
        return;
      }

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

  function showGameOver(options) {
    gameState.gameOver = true;
    stopTimer();
    saveAppState();
    const statistics = getStatisticsPayload();
    ui.showGameOver(
      statistics.stats,
      statistics.letterCorrectCounts,
      statistics.letterErrorCounts,
      options || {}
    );
    ui.renderStats(getDisplayStats(), gameContext.seed);
  }

  function startCurrentWordRound() {
    if (gameState.gameOver) {
      stopTimer();
      const statistics = getStatisticsPayload();
      ui.showGameOver(statistics.stats, statistics.letterCorrectCounts, statistics.letterErrorCounts, {});
      ui.renderStats(getDisplayStats(), gameContext.seed);
      return;
    }

    if (gameState.currentWordIndex === null) {
      gameState.currentWordIndex = wordScheduler.findNextWordIndex({
        gameState,
        wordSource: gameContext.selectedDataSet.wordSource,
        letterTransliterations: data.letterTransliterations,
        userProgressStats
      });
    }

    if (gameState.currentWordIndex === null) {
      showGameOver({});
      return;
    }

    const word = gameContext.selectedDataSet.wordSource[gameState.currentWordIndex];
    nextRandom = random.createSeededRandom(`${gameContext.seed}:${gameContext.dataSetId}:${gameContext.gameModeId}:${gameState.roundCounter}:${gameState.currentWordIndex}`);
    gameState.currentWordHadWrongAnswer = false;
    currentWordState = new CurrentWordState(
      word,
      trainingLetters.getTrainableWordLetters(data.letterTransliterations, word)
        .map((letter) => trainingLetters.chooseQuestionLetterVariant({
          letterTransliterations: data.letterTransliterations,
          userProgressStats,
          random,
          nextRandom,
          letter
        }))
    );
    saveAppState();
    advanceCurrentWordRound();
  }

  function clearProgressAndGoToFrontPage() {
    storage.clear();
    urlSettings.goToFrontPage();
  }

  function handleRoundNext() {
    resumeTimer();

    if (isTimeExpired()) {
      showGameOver({ timeExpired: true });
      return;
    }

    if (gameState.currentWordHadWrongAnswer) {
      gameState.roundCounter += 1;
      gameState.currentWordHadWrongAnswer = false;
      saveAppState();
      startCurrentWordRound();
      return;
    }

    gameState.currentWordIndex = wordScheduler.findNextWordIndex({
      gameState,
      wordSource: gameContext.selectedDataSet.wordSource,
      letterTransliterations: data.letterTransliterations,
      userProgressStats
    });
    if (gameState.currentWordIndex === null) {
      showGameOver({});
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
      onShowProgress: () => {
        pauseTimer();
        const statistics = getStatisticsPayload();
        ui.showProgress(statistics.stats, statistics.letterCorrectCounts, statistics.letterErrorCounts);
      },
      onHideProgress: resumeTimer,
      onNewGame: clearProgressAndGoToFrontPage
    });

    const settings = urlSettings.readGameUrlSettings(
      data.datasets.map((dataset) => dataset.id),
      GAME_MODES.map((mode) => mode.id)
    );

    if (settings === null) {
      return;
    }

    gameContext = {
      seed: settings.seed,
      dataSetId: settings.dataSetId,
      gameModeId: settings.gameModeId,
      durationSeconds: settings.durationSeconds,
      selectedDataSet: data.datasets.find((dataset) => dataset.id === settings.dataSetId)
    };
    const persistedState = storage.load();
    userProgressStats = persistedState.userProgressStats;
    gameState = persistedState.gameState;
    gameState.setWordOrder(
      wordScheduler.createWordOrder({
        random,
        seed: gameContext.seed,
        dataSetId: gameContext.dataSetId,
        wordSource: gameContext.selectedDataSet.wordSource
      }),
      gameContext.selectedDataSet.wordSource.length
    );
    saveAppState();
    startTimer();
    startCurrentWordRound();
  }

  window.CyrillicGame = {
    init
  };
}());
