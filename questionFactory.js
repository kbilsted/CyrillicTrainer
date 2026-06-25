(function () {
  "use strict";

  const WRONG_ANSWER_OPTION_COUNT = 5;

  function getTransliterationForLetter(letterTransliterations, cyrillicLetter) {
    const match = letterTransliterations.find((letter) => letter.cyrillic === cyrillicLetter);

    if (!match) {
      throw new Error(`Missing transliteration for ${cyrillicLetter}`);
    }

    return match;
  }

  function chooseLatinAnswerOptions(random, nextRandom, letterOptions, letterTransliteration) {
    const correctAnswer = letterTransliteration.latin;
    const isUppercaseLetter = letterTransliteration.cyrillic === letterTransliteration.cyrillic.toUpperCase();
    const options = letterOptions.map((option) => (
      isUppercaseLetter ? option.toUpperCase() : option
    ));
    const mustAskChoices = (letterTransliteration.cyrillicToLatinMustAsk || [])
      .filter((option, index, values) => (
        option !== correctAnswer
        && options.includes(option)
        && values.indexOf(option) === index
      ))
      .slice(0, 4);
    const wrongChoices = options.filter((option) => option !== correctAnswer);
    const extraWrongChoices = wrongChoices.filter((option) => !mustAskChoices.includes(option));
    const shuffledExtraWrongChoices = random.shuffleSeeded(nextRandom, extraWrongChoices);
    const selectedWrongChoices = mustAskChoices
      .concat(shuffledExtraWrongChoices)
      .slice(0, WRONG_ANSWER_OPTION_COUNT);

    return random.shuffleSeeded(nextRandom, selectedWrongChoices.concat(correctAnswer));
  }

  function chooseCyrillicAnswerOptions(random, nextRandom, letterTransliterations, letterTransliteration) {
    const correctAnswer = letterTransliteration.cyrillic;
    const isUppercaseLetter = letterTransliteration.cyrillic === letterTransliteration.cyrillic.toUpperCase();
    const cyrillicOptions = letterTransliterations
      .filter((entry) => (
        isUppercaseLetter
          ? entry.cyrillic === entry.cyrillic.toUpperCase()
          : entry.cyrillic === entry.cyrillic.toLowerCase()
      ))
      .map((entry) => entry.cyrillic);
    const mustAskChoices = (letterTransliteration.latinToCyrillicMustAsk || [])
      .filter((option, index, values) => (
        option !== correctAnswer
        && cyrillicOptions.includes(option)
        && values.indexOf(option) === index
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

  function createQuestion(settings) {
    const isLatinToCyrillicMode = settings.gameModeId === settings.latinToCyrillicModeId;
    const correctAnswer = isLatinToCyrillicMode
      ? settings.letterTransliteration.cyrillic
      : settings.letterTransliteration.latin;
    const prompt = isLatinToCyrillicMode
      ? settings.letterTransliteration.latin
      : settings.letterTransliteration.cyrillic;
    const options = isLatinToCyrillicMode
      ? chooseCyrillicAnswerOptions(settings.random, settings.nextRandom, settings.letterTransliterations, settings.letterTransliteration)
      : chooseLatinAnswerOptions(settings.random, settings.nextRandom, settings.letterOptions, settings.letterTransliteration);

    return {
      correctAnswer,
      prompt,
      options
    };
  }

  window.CyrillicQuestionFactory = {
    getTransliterationForLetter,
    createQuestion
  };
}());
