(function ($) {
  "use strict";

  let callbacks = {
    onHomeStart: null,
    onHomeRandomGame: null
  };
  let selectedDurationSeconds = 300;

  function renderSelectedDuration() {
    $(".duration-button").each(function () {
      const button = $(this);
      const isSelected = Number(button.data("seconds")) === selectedDurationSeconds;

      button
        .toggleClass("btn-dark", isSelected)
        .toggleClass("btn-outline-dark", !isSelected)
        .attr("aria-pressed", String(isSelected));
    });
  }

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
          gameModeId: $("#homeGameModeSelect").val(),
          durationSeconds: selectedDurationSeconds
        });
      }
    });

    $("#homeDurationButtons").on("click", ".duration-button", function () {
      selectedDurationSeconds = Number($(this).data("seconds"));
      renderSelectedDuration();
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
    selectedDurationSeconds = settings.durationSeconds;
    renderSelectedDuration();
  }

  window.CyrillicFrontPageUI = {
    init,
    renderFrontPageControls
  };
}(window.jQuery));
