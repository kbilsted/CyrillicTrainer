(function ($) {
  "use strict";

  let callbacks = {
    onAnswer: null,
    onLetterNext: null,
    onRoundNext: null,
    onShowProgress: null,
    onNewGame: null
  };

  const CORRECT_ANSWER_AUTO_NEXT_DELAY_MS = 500;

  let hiddenPhoneticValue = "";
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

    $("#gameNewGameButton, #newGameButton").on("click", function () {
      if (
        callbacks.onNewGame
        && window.confirm("Start a new game? This clears scores, recent correct letters, and error progress.")
      ) {
        callbacks.onNewGame();
      }
    });
  }

  function renderStats(stats) {
    $("#successCounter").text(stats.successCounter);
    $("#failCounter").text(stats.failCounter);
    $("#successRatio").text(stats.successRatio);
    $("#roundCounter").text(stats.roundCounter);
  }

  function revealRoundDoneDetails() {
    $("#donePhonetic").text(hiddenPhoneticValue).removeClass("d-none");
    $("#doneLatin").text(hiddenLatinValue).removeClass("d-none");
    $("#doneMeaning").text(hiddenMeaningValue).removeClass("d-none");
    $(".reveal-word-button").addClass("d-none");
  }

  function showLetterGuess(title, prompt, options) {
    clearAutoNextTimer();
    $("#roundDoneView").addClass("d-none");
    $("#gameOverView").addClass("d-none");
    $("#letterGuessView").removeClass("d-none");
    $("#questionTitle").text(title);
    $("#letterCard").text(prompt);
    $("#letterNextButton").prop("disabled", true).addClass("hidden");

    const buttons = options.map((option) => (
      $("<button>")
        .attr("type", "button")
        .addClass("btn btn-outline-dark answer-button")
        .data("value", option)
        .text(option)
    ));

    $("#answerButtons").empty().append(buttons);

    $("#answerButtons .answer-button").each(function (index) {
      const button = $(this);
      window.setTimeout(() => {
        button.addClass("zoom");
        button.one("animationend", function () {
          button.removeClass("zoom");
        });
      }, index * 50);
    });
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
        button.removeClass("btn-outline-dark").addClass("is-wrong shake");
        button.one("animationend", function () {
          button.removeClass("shake");
        });
      }
    });

    if (options.autoNext) {
      $("#letterNextButton").prop("disabled", true).addClass("hidden");
      autoNextTimer = window.setTimeout(() => {
        autoNextTimer = null;
        options.onAutoNext();
      }, CORRECT_ANSWER_AUTO_NEXT_DELAY_MS);
    } else {
      $("#letterNextButton").prop("disabled", false).removeClass("hidden");
    }
  }

  function renderErrorHistogram(container, letterErrorCounts) {
    const entries = Object.entries(letterErrorCounts)
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

    container.empty().append(
      $("<p>")
        .addClass("progress-description")
        .text("This chart shows the Cyrillic letters you get wrong most often.")
    );

    if (entries.length === 0) {
      container.append($("<p>").addClass("progress-empty").text("No errors yet."));
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

    container.append($("<div>").addClass("error-histogram").append(bars));
  }

  function showProgress(letterErrorCounts) {
    $("#progressPanel").removeClass("d-none");
    renderErrorHistogram($("#progressPanel"), letterErrorCounts);
  }

  function showRoundDone(word, options) {
    clearAutoNextTimer();
    $("#letterGuessView").addClass("d-none");
    $("#gameOverView").addClass("d-none");
    $("#roundDoneView").removeClass("d-none");
    $("#doneCyrillic").text(word.cyrillic);
    hiddenPhoneticValue = word.phonetic;
    hiddenLatinValue = word.latin;
    hiddenMeaningValue = word.englishMeaning;
    $("#donePhonetic").text("").addClass("d-none");
    $("#doneLatin").text("").addClass("d-none");
    $("#doneMeaning").text("").addClass("d-none");
    $("#progressPanel").addClass("d-none").empty();
    $("#roundNextButton").text(options.retryWord ? "retry word" : "next");
    $(".reveal-word-button").removeClass("d-none");
  }

  function showGameOver(stats, letterErrorCounts) {
    clearAutoNextTimer();
    $("#letterGuessView").addClass("d-none");
    $("#roundDoneView").addClass("d-none");
    $("#gameOverView").removeClass("d-none");
    $("#gameOverCorrect").text(stats.successCounter);
    $("#gameOverWrong").text(stats.failCounter);
    $("#gameOverRatio").text(stats.successRatio);
    renderErrorHistogram($("#gameOverProgressPanel"), letterErrorCounts);
  }

  window.CyrillicGameUI = {
    init,
    renderStats,
    showLetterGuess,
    showAnswerFeedback,
    showProgress,
    showRoundDone,
    showGameOver
  };
}(window.jQuery));
