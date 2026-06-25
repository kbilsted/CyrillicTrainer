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

  function readGameUrlSettings(validDataSetIds, validGameModeIds) {
    const url = new URL(window.location.href);
    const existingGame = url.searchParams.get(GAME_PARAM);
    const existingDataSetId = url.searchParams.get(DATA_PARAM);
    const existingGameModeId = url.searchParams.get(GAME_MODE_PARAM);
    const validIds = new Set(validDataSetIds);
    const validModeIds = new Set(validGameModeIds);

    if (
      existingGame === null
      || existingGame !== normalizeSeed(existingGame)
      || url.searchParams.has(LEGACY_SEED_PARAM)
      || !validIds.has(existingDataSetId)
      || !validModeIds.has(existingGameModeId)
    ) {
      window.location.replace(new URL(FRONT_PAGE_FILE, window.location.href).toString());
      return null;
    }

    return {
      seed: existingGame,
      dataSetId: existingDataSetId,
      gameModeId: existingGameModeId
    };
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
    readGameUrlSettings,
    startGame,
    goToFrontPage
  };
}());
