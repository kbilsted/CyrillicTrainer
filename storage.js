(function () {
  "use strict";

  const STORAGE_KEY = "cyrillicTrainerScores";
  const RECENT_CORRECT_LETTERS_KEY = "cyrillicTrainerRecentCorrectLetters";
  const DEFAULT_SCORE = {
    successCounter: 0,
    failCounter: 0,
    roundCounter: 0
  };

  function load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      return {
        successCounter: Number(parsed.successCounter) || 0,
        failCounter: Number(parsed.failCounter) || 0,
        roundCounter: Number(parsed.roundCounter) || 0
      };
    } catch (error) {
      return { ...DEFAULT_SCORE };
    }
  }

  function loadRecentCorrectLetters() {
    try {
      const raw = window.localStorage.getItem(RECENT_CORRECT_LETTERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      return Array.isArray(parsed) ? parsed.filter((letter) => typeof letter === "string") : [];
    } catch (error) {
      return [];
    }
  }

  let score = load();
  let recentCorrectLetters = loadRecentCorrectLetters();

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
  }

  function saveRecentCorrectLetters() {
    window.localStorage.setItem(RECENT_CORRECT_LETTERS_KEY, JSON.stringify(recentCorrectLetters));
  }

  function getStats() {
    const total = score.successCounter + score.failCounter;
    const ratio = total === 0 ? 0 : (score.successCounter / total) * 100;

    return {
      successCounter: score.successCounter,
      failCounter: score.failCounter,
      roundCounter: score.roundCounter,
      successRatio: `${ratio.toFixed(1)}%`
    };
  }

  function incrementSuccess() {
    score.successCounter += 1;
    save();
    return getStats();
  }

  function incrementFail() {
    score.failCounter += 1;
    save();
    return getStats();
  }

  function incrementRound() {
    score.roundCounter += 1;
    save();
    return getStats();
  }

  function getRecentCorrectLetters() {
    return recentCorrectLetters.slice();
  }

  function setRecentCorrectLetters(letters) {
    recentCorrectLetters = letters.filter((letter) => typeof letter === "string");
    saveRecentCorrectLetters();
  }

  window.CyrillicStorage = {
    getStats,
    incrementSuccess,
    incrementFail,
    incrementRound,
    getRecentCorrectLetters,
    setRecentCorrectLetters
  };
}());
