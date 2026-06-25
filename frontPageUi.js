(function ($) {
  "use strict";

  let callbacks = {
    onHomeStart: null,
    onHomeRandomGame: null
  };

  function init(nextCallbacks) {
    callbacks = nextCallbacks;

    $("#homeGameModeSwitcher").on("click", ".game-mode-button", function () {
      const selectedValue = $(this).data("value");

      $("#homeGameModeSwitcher .game-mode-button").each(function () {
        const button = $(this);
        const isActive = button.data("value") === selectedValue;

        button
          .toggleClass("btn-dark", isActive)
          .toggleClass("btn-outline-dark", !isActive)
          .attr("aria-pressed", isActive ? "true" : "false");
      });
    });

    $("#homeRandomGameButton").on("click", function () {
      if (callbacks.onHomeRandomGame) {
        $("#homeGameInput").val(callbacks.onHomeRandomGame());
      }
    });

    $("#startGameForm").on("submit", function (event) {
      event.preventDefault();

      const selectedModeButton = $("#homeGameModeSwitcher .game-mode-button[aria-pressed='true']");

      if (callbacks.onHomeStart) {
        callbacks.onHomeStart({
          seed: $("#homeGameInput").val(),
          dataSetId: $("#homeDatasetSelect").val(),
          gameModeId: selectedModeButton.data("value")
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
    $("#homeGameInput").val(settings.seed);
    renderGameModeButtons($("#homeGameModeSwitcher"), gameModes, settings.gameModeId);
  }

  function renderGameModeButtons(container, gameModes, activeGameModeId) {
    const buttons = gameModes.map((mode) => (
      $("<button>")
        .attr("type", "button")
        .addClass(`btn btn-sm game-mode-button ${mode.id === activeGameModeId ? "btn-dark" : "btn-outline-dark"}`)
        .attr("aria-pressed", mode.id === activeGameModeId ? "true" : "false")
        .data("value", mode.id)
        .text(mode.title)
    ));

    container.empty().append(buttons);
  }

  window.CyrillicFrontPageUI = {
    init,
    renderFrontPageControls
  };
}(window.jQuery));
