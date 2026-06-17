(function () {
  "use strict";

  const STORAGE_KEY = "cyrillicTrainerScores";
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

  let score = load();

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
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

  window.CyrillicStorage = {
    getStats,
    incrementSuccess,
    incrementFail,
    incrementRound
  };
}());
