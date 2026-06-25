(function () {
  "use strict";

  const trainingLetters = window.CyrillicTrainingLetters;

  function isWordAskable(settings, word) {
    return trainingLetters.getTrainableWordLetters(settings.letterTransliterations, word)
      .flatMap((letter) => trainingLetters.getTrainableCaseVariants(settings.letterTransliterations, letter))
      .some((letter) => !settings.userProgressStats.wasRecentlyCorrect(letter));
  }

  function createWordOrder(settings) {
    const wordIndexes = settings.wordSource.map((_, index) => index);

    return settings.random.shuffleSeeded(
      settings.random.createSeededRandom(`${settings.seed}:${settings.dataSetId}:wordOrder`),
      wordIndexes
    );
  }

  function findNextWordIndex(settings) {
    while (settings.gameState.wordCursor < settings.gameState.wordOrder.length) {
      const nextWordIndex = settings.gameState.wordOrder[settings.gameState.wordCursor];
      settings.gameState.wordCursor += 1;

      if (isWordAskable(settings, settings.wordSource[nextWordIndex])) {
        return nextWordIndex;
      }
    }

    return null;
  }

  window.CyrillicWordScheduler = {
    createWordOrder,
    findNextWordIndex
  };
}());
