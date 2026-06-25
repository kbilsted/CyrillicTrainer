(function () {
  "use strict";

  const GAME_PARAM = "game";
  const DATA_PARAM = "data";
  const GAME_MODE_PARAM = "gameMode";
  const LEGACY_SEED_PARAM = "seed";
  const FRONT_PAGE_FILE = "index.html";
  const GAME_PAGE_FILE = "game.html";

  function createSeed() {
    return String(Math.floor(Math.random() * 900000000) + 100000000);
  }

  function normalizeSeed(seedValue) {
    const parsed = Number.parseInt(seedValue, 10);
    return Number.isFinite(parsed) ? String(Math.abs(parsed)) : createSeed();
  }

  function normalizeGameUrlSettings(defaultDataSetId, validDataSetIds, defaultGameModeId, validGameModeIds) {
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

  function startGame(settings) {
    const url = new URL(GAME_PAGE_FILE, window.location.href);
    url.searchParams.set(GAME_PARAM, normalizeSeed(settings.seed));
    url.searchParams.set(DATA_PARAM, settings.dataSetId);
    url.searchParams.set(GAME_MODE_PARAM, settings.gameModeId);
    url.searchParams.delete(LEGACY_SEED_PARAM);
    window.location.assign(url.toString());
  }

  function goToFrontPage() {
    const url = new URL(FRONT_PAGE_FILE, window.location.href);
    window.location.assign(url.toString());
  }

  window.CyrillicUrlSettings = {
    createSeed,
    normalizeGameUrlSettings,
    startGame,
    goToFrontPage
  };
}());
