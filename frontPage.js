(function () {
  "use strict";

  const data = window.CYRILLIC_TRAINER_DATA;
  const urlSettings = window.CyrillicUrlSettings;
  const storage = window.CyrillicStorage;
  const ui = window.CyrillicFrontPageUI;
  const GAME_MODES = [
    { id: "1", title: "Cyrilic → Latin" },
    { id: "2", title: "Latin → Cyrilic" }
  ];
  const CYRILIC_TO_LATIN_MODE_ID = "1";
  const DEFAULT_FRONT_PAGE_DATA_SET_ID = "2";

  function handleStartGameFromFrontPage(settings) {
    storage.clear();
    urlSettings.startGame(settings);
  }

  function init() {
    const defaultFrontPageDataSet = data.datasets.some((dataset) => dataset.id === DEFAULT_FRONT_PAGE_DATA_SET_ID)
      ? DEFAULT_FRONT_PAGE_DATA_SET_ID
      : data.datasets[0].id;

    ui.init({
      onHomeStart: handleStartGameFromFrontPage,
      onHomeRandomGame: urlSettings.createSeed
    });
    ui.renderFrontPageControls(data.datasets, GAME_MODES, {
      seed: urlSettings.createSeed(),
      dataSetId: defaultFrontPageDataSet,
      gameModeId: CYRILIC_TO_LATIN_MODE_ID
    });
  }

  window.CyrillicFrontPage = {
    init
  };
}());
