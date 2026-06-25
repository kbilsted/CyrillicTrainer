(function () {
  "use strict";

  const GAME_PARAM = "game";
  const DATA_PARAM = "data";
  const GAME_MODE_PARAM = "gameMode";
  const LEGACY_SEED_PARAM = "seed";

  function createSeed() {
    return String(Math.floor(Math.random() * 900000000) + 100000000);
  }

  function normalizeSeed(seedValue) {
    const parsed = Number.parseInt(seedValue, 10);
    return Number.isFinite(parsed) ? String(Math.abs(parsed)) : createSeed();
  }

  function ensureUrlSettings(defaultDataSetId, validDataSetIds, defaultGameModeId, validGameModeIds) {
    const url = new URL(window.location.href);
    const existingGame = url.searchParams.get(GAME_PARAM);
    const legacySeed = url.searchParams.get(LEGACY_SEED_PARAM);
    const existingDataSetId = url.searchParams.get(DATA_PARAM);
    const existingGameModeId = url.searchParams.get(GAME_MODE_PARAM);
    const validIds = new Set(validDataSetIds);
    const validModeIds = new Set(validGameModeIds);
    let changed = false;
    let seed = existingGame || legacySeed ? normalizeSeed(existingGame || legacySeed) : createSeed();
    let dataSetId = validIds.has(existingDataSetId) ? existingDataSetId : defaultDataSetId;
    let gameModeId = validModeIds.has(existingGameModeId) ? existingGameModeId : defaultGameModeId;

    if (seed !== existingGame) {
      url.searchParams.set(GAME_PARAM, seed);
      changed = true;
    }

    if (legacySeed !== null) {
      url.searchParams.delete(LEGACY_SEED_PARAM);
      changed = true;
    }

    if (dataSetId !== existingDataSetId) {
      url.searchParams.set(DATA_PARAM, dataSetId);
      changed = true;
    }

    if (gameModeId !== existingGameModeId) {
      url.searchParams.set(GAME_MODE_PARAM, gameModeId);
      changed = true;
    }

    if (changed) {
      window.location.replace(url.toString());
    }

    return { seed, dataSetId, gameModeId };
  }

  function ensureSeed() {
    return ensureUrlSettings("1", ["1"], "1", ["1"]).seed;
  }

  function switchDataSet(dataSetId) {
    const url = new URL(window.location.href);
    url.searchParams.set(DATA_PARAM, dataSetId);
    window.location.assign(url.toString());
  }

  function switchSeed(seedValue) {
    const url = new URL(window.location.href);
    url.searchParams.set(GAME_PARAM, normalizeSeed(seedValue));
    url.searchParams.delete(LEGACY_SEED_PARAM);
    window.location.assign(url.toString());
  }

  function switchGameMode(gameModeId) {
    const url = new URL(window.location.href);
    url.searchParams.set(GAME_MODE_PARAM, gameModeId);
    window.location.assign(url.toString());
  }

  function hashSeed(seed) {
    let hash = 2166136261;
    const text = String(seed);

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    let state = hashSeed(seed);

    return function nextRandom() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomInt(nextRandom, maxExclusive) {
    return Math.floor(nextRandom() * maxExclusive);
  }

  function choose(nextRandom, values) {
    return values[randomInt(nextRandom, values.length)];
  }

  function shuffleSeeded(nextRandom, values) {
    const shuffled = values.slice();

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(nextRandom, index + 1);
      const current = shuffled[index];
      shuffled[index] = shuffled[swapIndex];
      shuffled[swapIndex] = current;
    }

    return shuffled;
  }

  window.CyrillicRandom = {
    ensureUrlSettings,
    ensureSeed,
    switchDataSet,
    switchSeed,
    switchGameMode,
    createSeededRandom,
    choose,
    shuffleSeeded
  };
}());
