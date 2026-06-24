// Module wrapper that owns score and recent-letter localStorage state.
// Called immediately by the browser when storage.js is loaded.
(function () {
  "use strict";

  const STORAGE_KEY = "cyrillicTrainerScores";
  const RECENT_CORRECT_LETTERS_KEY = "cyrillicTrainerRecentCorrectLetters";
  const DEFAULT_SCORE = {
    successCounter: 0,
    failCounter: 0,
    roundCounter: 0
  };

  // Loads persisted counters, using zeroed defaults if localStorage is empty or invalid.
  // Called once during module initialization.
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

  // Loads the recent-correct Cyrillic letters used by the skip rule.
  // Called once during module initialization.
  function loadRecentCorrectLetters() {
    try {
      const raw = window.localStorage.getItem(RECENT_CORRECT_LETTERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      // Keeps only valid string entries from persisted recent-correct data.
      // Called only by Array.filter in loadRecentCorrectLetters.
      return Array.isArray(parsed) ? parsed.filter((letter) => typeof letter === "string") : [];
    } catch (error) {
      return [];
    }
  }

  let score = load();
  let recentCorrectLetters = loadRecentCorrectLetters();

  // Persists the score counters to localStorage.
  // Called by score mutators and resetProgress.
  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
  }

  // Persists the recent-correct letter list to localStorage.
  // Called by setRecentCorrectLetters and resetProgress.
  function saveRecentCorrectLetters() {
    window.localStorage.setItem(RECENT_CORRECT_LETTERS_KEY, JSON.stringify(recentCorrectLetters));
  }

  // Builds the display-ready score snapshot, including the formatted success ratio.
  // Called by CyrillicGame.renderStats and score mutators.
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

  // Adds one correct answer, persists it, and returns fresh stats.
  // Called only by CyrillicGame.handleAnswer.
  function incrementSuccess() {
    score.successCounter += 1;
    save();
    return getStats();
  }

  // Adds one wrong answer, persists it, and returns fresh stats.
  // Called only by CyrillicGame.handleAnswer.
  function incrementFail() {
    score.failCounter += 1;
    save();
    return getStats();
  }

  // Adds one started round, persists it, and returns fresh stats.
  // Called only by CyrillicGame.startRound.
  function incrementRound() {
    score.roundCounter += 1;
    save();
    return getStats();
  }

  // Returns a defensive copy of the recent-correct letters.
  // Called only by CyrillicGame.init.
  function getRecentCorrectLetters() {
    return recentCorrectLetters.slice();
  }

  // Replaces the recent-correct list after filtering invalid values, then persists it.
  // Called by CyrillicGame remember/forget helpers.
  function setRecentCorrectLetters(letters) {
    // Keeps only string letters before saving caller-provided recent-correct state.
    // Called only by Array.filter in setRecentCorrectLetters.
    recentCorrectLetters = letters.filter((letter) => typeof letter === "string");
    saveRecentCorrectLetters();
  }

  // Clears scores and recent-correct letters, then persists the reset state.
  // Called only by CyrillicGame.handleReset.
  function resetProgress() {
    score = { ...DEFAULT_SCORE };
    recentCorrectLetters = [];
    save();
    saveRecentCorrectLetters();
    return getStats();
  }

  window.CyrillicStorage = {
    getStats,
    incrementSuccess,
    incrementFail,
    incrementRound,
    getRecentCorrectLetters,
    setRecentCorrectLetters,
    resetProgress
  };
}());
