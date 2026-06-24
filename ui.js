// Module wrapper that owns DOM rendering and event binding for the UI.
// Called immediately by the browser when ui.js is loaded.
(function ($) {
  "use strict";

  let callbacks = {
    onAnswer: null,
    onLetterNext: null,
    onRoundNext: null,
    onDataSetChange: null,
    onReset: null
  };

  let hiddenLatinValue = "";
  let hiddenMeaningValue = "";

  // Wires DOM events to the game callbacks provided by CyrillicGame.init.
  // Called only by CyrillicGame.init.
  function init(nextCallbacks) {
    callbacks = nextCallbacks;

    // Handles clicks on generated answer buttons.
    // Called only by jQuery's delegated answer-button click event.
    $("#answerButtons").on("click", ".answer-button", function () {
      if (callbacks.onAnswer) {
        callbacks.onAnswer($(this).data("value"));
      }
    });

    // Handles manual advance from one answered letter to the next.
    // Called only by jQuery's letter-next button click event.
    $("#letterNextButton").on("click", function () {
      if (callbacks.onLetterNext) {
        callbacks.onLetterNext();
      }
    });

    // Handles manual advance from round-done to the next word.
    // Called only by jQuery's round-next button click event.
    $("#roundNextButton").on("click", function () {
      if (callbacks.onRoundNext) {
        callbacks.onRoundNext();
      }
    });

    // Handles reveal clicks for Latin spelling and English meaning.
    // Called only by jQuery's reveal-word button click event.
    $(".reveal-word-button").on("click", function () {
      revealRoundDoneDetails();
    });

    // Handles dataset dropdown changes by delegating to the game callback.
    // Called only by jQuery's dataset-select change event.
    $("#datasetSelect").on("change", function () {
      if (callbacks.onDataSetChange) {
        callbacks.onDataSetChange($(this).val());
      }
    });

    // Handles reset clicks by delegating to the game callback.
    // Called only by jQuery's reset-button click event.
    $("#resetButton").on("click", function () {
      if (callbacks.onReset) {
        callbacks.onReset();
      }
    });
  }

  // Renders score counters, ratio, round number, and seed into the header/footer.
  // Called only by CyrillicGame.renderStats.
  function renderStats(stats, seed) {
    $("#successCounter").text(stats.successCounter);
    $("#failCounter").text(stats.failCounter);
    $("#successRatio").text(stats.successRatio);
    $("#roundCounter").text(stats.roundCounter);
    $("#seedValue").text(seed);
  }

  // Populates the dataset dropdown and marks the current dataset as selected.
  // Called only by CyrillicGame.init.
  function renderDataSetSwitcher(datasets, activeDataSetId) {
    // Converts each dataset definition into one dropdown option.
    // Called only by Array.map in renderDataSetSwitcher.
    const options = datasets.map((dataset) => (
      $("<option>")
        .attr("value", dataset.id)
        .text(dataset.label)
    ));

    $("#datasetSelect").empty().append(options).val(activeDataSetId);
  }

  // Reveals the Latin spelling and English meaning for the completed word.
  // Called only by the reveal-word button click handler.
  function revealRoundDoneDetails() {
    $("#doneLatin").text(hiddenLatinValue).removeClass("d-none");
    $("#doneMeaning").text(hiddenMeaningValue).removeClass("d-none");
    $(".reveal-word-button").addClass("d-none");
  }

  // Shows the letter-question view and renders the six answer buttons.
  // Called only by CyrillicGame.showCurrentLetter.
  function showLetterGuess(letter, options) {
    $("#roundDoneView").addClass("d-none");
    $("#letterGuessView").removeClass("d-none");
    $("#letterCard").text(letter);
    $("#letterNextButton").prop("disabled", true);

    // Converts each answer option value into one clickable answer button.
    // Called only by Array.map in showLetterGuess.
    const buttons = options.map((option) => (
      $("<button>")
        .attr("type", "button")
        .addClass("btn btn-outline-dark answer-button")
        .data("value", option)
        .text(option)
    ));

    $("#answerButtons").empty().append(buttons);
  }

  // Disables options and colors the selected and correct answer buttons.
  // Called only by CyrillicGame.handleAnswer.
  function showAnswerFeedback(selectedValue, correctValue) {
    // Applies feedback styles to each rendered answer button.
    // Called only by jQuery.each inside showAnswerFeedback.
    $(".answer-button").each(function () {
      const button = $(this);
      const value = button.data("value");
      button.prop("disabled", true);

      if (value === correctValue) {
        button.removeClass("btn-outline-dark").addClass("is-correct");
      } else if (value === selectedValue) {
        button.removeClass("btn-outline-dark").addClass("is-wrong");
      }
    });

    $("#letterNextButton").prop("disabled", false);
  }

  // Shows the completed-word view with Latin/meaning hidden until reveal.
  // Called only by CyrillicGame.showRoundDone.
  function showRoundDone(word) {
    $("#letterGuessView").addClass("d-none");
    $("#roundDoneView").removeClass("d-none");
    $("#doneCyrillic").text(word.cyrillic);
    hiddenLatinValue = word.latin;
    hiddenMeaningValue = word.englishmeaning;
    $("#doneLatin").text("").addClass("d-none");
    $("#doneMeaning").text("").addClass("d-none");
    $(".reveal-word-button").removeClass("d-none");
  }

  window.CyrillicUI = {
    init,
    renderStats,
    renderDataSetSwitcher,
    showLetterGuess,
    showAnswerFeedback,
    showRoundDone
  };
}(window.jQuery));
