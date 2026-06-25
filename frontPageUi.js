(function ($) {
  "use strict";

  let callbacks = {
    onHomeStart: null,
    onHomeRandomGame: null
  };

  function init(nextCallbacks) {
    callbacks = nextCallbacks;

    $("#homeRandomGameButton").on("click", function () {
      if (callbacks.onHomeRandomGame) {
        $("#homeGameInput").val(callbacks.onHomeRandomGame());
      }
    });

    $("#startGameForm").on("submit", function (event) {
      event.preventDefault();

      if (callbacks.onHomeStart) {
        callbacks.onHomeStart({
          seed: $("#homeGameInput").val(),
          dataSetId: $("#homeDatasetSelect").val(),
          gameModeId: $("#homeGameModeSelect").val()
        });
      }
    });
  }

  function renderFrontPageControls(datasets, gameModes, settings) {
    const options = datasets.map((dataset) => (
      $("<option>")
        .attr("value", dataset.id)
        .text(dataset.label)
    ));
    $("#homeDatasetSelect").empty().append(options).val(settings.dataSetId);

    const optionsGameMode = gameModes.map((gameMode) => (
      $("<option>")
        .attr("value", gameMode.id)
        .text(gameMode.title)
    ));
    $("#homeGameModeSelect").empty().append(optionsGameMode).val(settings.gameModeId);

    $("#homeGameInput").val(settings.seed);
  }

  window.CyrillicFrontPageUI = {
    init,
    renderFrontPageControls
  };
}(window.jQuery));
