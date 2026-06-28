(function ($) {
  "use strict";

  let callbacks = {
    onAnswer: null,
    onLetterNext: null,
    onRoundNext: null,
    onShowProgress: null,
    onHideProgress: null,
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

    $("#gameNewGameButton").on("click", function () {
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
  }

  function renderTimer(timer) {
    const minutes = Math.floor(timer.remainingSeconds / 60);
    const seconds = timer.remainingSeconds % 60;

    $("#countdownTimer")
      .text(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`)
      .toggleClass("is-ending", timer.remainingSeconds <= 20);
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

  function renderHistogram(title, emptyText, barClassName, letterCounts) {
    const entries = Object.entries(letterCounts)
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

    const section = $("<section>").addClass("stats-chart").append(
      $("<h2>").addClass("stats-chart-title").text(title)
    );

    if (entries.length === 0) {
      return section.append($("<p>").addClass("progress-empty").text(emptyText));
    }

    const maxCount = entries[0][1];
    const bars = entries.map(([letter, count]) => (
      $("<div>")
        .addClass("error-bar-item")
        .append(
          $("<div>").addClass("error-count").text(count),
          $("<div>")
            .addClass(`error-bar ${barClassName}`)
            .css("height", `${Math.max(12, Math.round((count / maxCount) * 120))}px`),
          $("<div>").addClass("error-letter").text(letter)
        )
    ));

    return section.append($("<div>").addClass("error-histogram").append(bars));
  }

  function renderStatistics(container, stats, letterCorrectCounts, letterErrorCounts) {
    container.empty().append(
      $("<dl>").addClass("stats-summary").append(
        $("<div>").append($("<dt>").text("Wrong:"), $("<dd>").text(stats.failCounter)),
        $("<div>").append($("<dt>").text("Correct:"), $("<dd>").text(stats.successCounter)),
        $("<div>").append($("<dt>").text("Ratio:"), $("<dd>").text(stats.successRatio))
      ),
      renderHistogram("Most correct", "No correct answers yet.", "is-correct", letterCorrectCounts),
      renderHistogram("Most errors", "No errors yet.", "is-wrong", letterErrorCounts)
    );
  }

  function showProgress(stats, letterCorrectCounts, letterErrorCounts) {
    $("#progressPanel").removeClass("d-none");
    $("#showProgressButton").addClass("d-none");
    renderStatistics($("#progressPanel"), stats, letterCorrectCounts, letterErrorCounts);
  }

  function showRoundDone(word, options) {
    clearAutoNextTimer();
    if (callbacks.onHideProgress) {
      callbacks.onHideProgress();
    }
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
    $("#showProgressButton").removeClass("d-none");
    $("#roundNextButton").text(options.retryWord ? "retry word" : "next");
    $(".reveal-word-button").removeClass("d-none");
  }

  function showGameOver(stats, letterCorrectCounts, letterErrorCounts, options) {
    clearAutoNextTimer();
    $("#letterGuessView").addClass("d-none");
    $("#roundDoneView").addClass("d-none");
    $("#gameOverView").removeClass("d-none");
    $("#gameOverView h1").text(options && options.timeExpired ? "TIME IS UP" : "GAME DONE");
    renderStatistics($("#gameOverProgressPanel"), stats, letterCorrectCounts, letterErrorCounts);
  }

  window.CyrillicGameUI = {
    init,
    renderStats,
    renderTimer,
    showLetterGuess,
    showAnswerFeedback,
    showProgress,
    showRoundDone,
    showGameOver
  };
}(window.jQuery));
