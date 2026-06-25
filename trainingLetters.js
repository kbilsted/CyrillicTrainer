(function () {
  "use strict";

  function isTrainableLetter(letterTransliterations, letter) {
    return letterTransliterations.some((item) => item.cyrillic === letter);
  }

  function getTrainableCaseVariants(letterTransliterations, letter) {
    const lowerLetter = letter.toLowerCase();
    const upperLetter = letter.toUpperCase();

    return [lowerLetter, upperLetter].filter((variant, index, variants) => (
      isTrainableLetter(letterTransliterations, variant)
      && variants.indexOf(variant) === index
    ));
  }

  function getTrainableWordLetters(letterTransliterations, word) {
    return Array.from(word.cyrillic).filter((letter) => isTrainableLetter(letterTransliterations, letter));
  }

  function chooseQuestionLetterVariant(settings) {
    const variants = getTrainableCaseVariants(settings.letterTransliterations, settings.letter);
    const availableVariants = variants.filter((variant) => !settings.userProgressStats.wasRecentlyCorrect(variant));

    return settings.random.choose(
      settings.nextRandom,
      availableVariants.length > 0 ? availableVariants : variants
    );
  }

  window.CyrillicTrainingLetters = {
    getTrainableCaseVariants,
    getTrainableWordLetters,
    chooseQuestionLetterVariant
  };
}());
