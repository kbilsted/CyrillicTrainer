(function ($) {
  "use strict";

  let callbacks = {
    onAnswer: null,
    onLetterNext: null,
    onRoundNext: null,
    onDataSetChange: null,
    onSeedChange: null,
    onGameModeChange: null,
    onShowProgress: null,
    onReset: null
  };

  const CORRECT_ANSWER_AUTO_NEXT_DELAY_MS = 500;

  let hiddenLatinValue = "";
  let hiddenMeaningValue = "";
  let autoNextTimer = null;

  function clearAutoNextTimer() {
    if (autoNextTimer !== null) {
      window.clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function init(nextCallbacks) {
    callbacks = nextCallbacks;

    $("#answerButtons").on("click", ".answer-button", function () {
      if (callbacks.onAnswer) {
        callbacks.onAnswer($(this).data("value"));
      }
    });

    $("#letterNextButton").on("click", function () {
      if (callbacks.onLetterNext) {
        callbacks.onLetterNext();
      }
    });

    $("#roundNextButton").on("click", function () {
      if (callbacks.onRoundNext) {
        callbacks.onRoundNext();
      }
    });

    $(".reveal-word-button").on("click", function () {
      revealRoundDoneDetails();
    });

    $("#showProgressButton").on("click", function () {
      if (callbacks.onShowProgress) {
        callbacks.onShowProgress();
      }
    });

    $("#datasetSelect").on("change", function () {
      if (callbacks.onDataSetChange) {
        callbacks.onDataSetChange($(this).val());
      }
    });

    $("#gameModeSwitcher").on("click", ".game-mode-button", function () {
      if (callbacks.onGameModeChange) {
        callbacks.onGameModeChange($(this).data("value"));
      }
    });

    $("#gameForm").on("submit", function (event) {
      event.preventDefault();

      if (callbacks.onSeedChange) {
        callbacks.onSeedChange($("#gameInput").val());
      }
    });

    $("#resetButton").on("click", function () {
      if (
        callbacks.onReset
        && window.confirm("Reset all data? This clears scores, recent correct letters, and error progress.")
      ) {
        callbacks.onReset();
      }
    });
  }

  function renderStats(stats, seed) {
    $("#successCounter").text(stats.successCounter);
    $("#failCounter").text(stats.failCounter);
    $("#successRatio").text(stats.successRatio);
    $("#roundCounter").text(stats.roundCounter);

    if (!$("#gameInput").is(":focus")) {
      $("#gameInput").val(seed);
    }
  }

  function renderDataSetSwitcher(datasets, activeDataSetId) {
    const options = datasets.map((dataset) => (
      $("<option>")
        .attr("value", dataset.id)
        .text(dataset.label)
    ));

    $("#datasetSelect").empty().append(options).val(activeDataSetId);
  }

  function renderGameModeSwitcher(gameModes, activeGameModeId) {
    const buttons = gameModes.map((mode) => (
      $("<button>")
        .attr("type", "button")
        .addClass(`btn btn-sm game-mode-button ${mode.id === activeGameModeId ? "btn-dark" : "btn-outline-dark"}`)
        .attr("aria-pressed", mode.id === activeGameModeId ? "true" : "false")
        .data("value", mode.id)
        .text(mode.title)
    ));

    $("#gameModeSwitcher").empty().append(buttons);
  }

  function revealRoundDoneDetails() {
    $("#doneLatin").text(hiddenLatinValue).removeClass("d-none");
    $("#doneMeaning").text(hiddenMeaningValue).removeClass("d-none");
    $(".reveal-word-button").addClass("d-none");
  }

  function showLetterGuess(title, prompt, options) {
    clearAutoNextTimer();
    $("#roundDoneView").addClass("d-none");
    $("#letterGuessView").removeClass("d-none");
    $("#questionTitle").text(title);
    $("#letterCard").text(prompt);
    $("#letterNextButton").prop("disabled", true);

    const buttons = options.map((option) => (
      $("<button>")
        .attr("type", "button")
        .addClass("btn btn-outline-dark answer-button")
        .data("value", option)
        .text(option)
    ));

    $("#answerButtons").empty().append(buttons);
  }

  function showAnswerFeedback(selectedValue, correctValue, options) {
    clearAutoNextTimer();

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

    if (options.autoNext) {
      autoNextTimer = window.setTimeout(() => {
        autoNextTimer = null;
        options.onAutoNext();
      }, CORRECT_ANSWER_AUTO_NEXT_DELAY_MS);
    }
  }

  function showProgress(letterErrorCounts) {
    const entries = Object.entries(letterErrorCounts)
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

    if (entries.length === 0) {
      $("#progressPanel")
        .removeClass("d-none")
        .empty()
        .append($("<p>").addClass("progress-empty").text("No errors yet."));
      return;
    }

    const maxCount = entries[0][1];
    const bars = entries.map(([letter, count]) => (
      $("<div>")
        .addClass("error-bar-item")
        .append(
          $("<div>").addClass("error-count").text(count),
          $("<div>")
            .addClass("error-bar")
            .css("height", `${Math.max(12, Math.round((count / maxCount) * 120))}px`),
          $("<div>").addClass("error-letter").text(letter)
        )
    ));

    $("#progressPanel")
      .removeClass("d-none")
      .empty()
      .append($("<div>").addClass("error-histogram").append(bars));
  }

  function showRoundDone(word) {
    clearAutoNextTimer();
    $("#letterGuessView").addClass("d-none");
    $("#roundDoneView").removeClass("d-none");
    $("#doneCyrillic").text(word.cyrillic);
    hiddenLatinValue = word.latin;
    hiddenMeaningValue = word.englishmeaning;
    $("#doneLatin").text("").addClass("d-none");
    $("#doneMeaning").text("").addClass("d-none");
    $("#progressPanel").addClass("d-none").empty();
    $(".reveal-word-button").removeClass("d-none");
  }

  window.CyrillicUI = {
    init,
    renderStats,
    renderDataSetSwitcher,
    renderGameModeSwitcher,
    showLetterGuess,
    showAnswerFeedback,
    showProgress,
    showRoundDone
  };
}(window.jQuery));
