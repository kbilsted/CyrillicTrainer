(function () {
  "use strict";

  // CurrentWordState owns runtime progress inside the active word round; it is recreated for each started word and not persisted.
  class CurrentWordState {
    constructor(word, letters) {
      this.word = word;
      this.letters = Array.isArray(letters) ? letters : [];
      this.letterIndex = 0;
      this.correctAnswer = null;
      this.isQuestionAnswered = false;
    }

    moveToNextAvailableLetter(userProgressStats) {
      while (
        this.hasCurrentLetter()
        && userProgressStats.wasRecentlyCorrect(this.getCurrentLetter())
      ) {
        this.advanceLetter();
      }

      return this.hasCurrentLetter();
    }

    hasCurrentLetter() {
      return this.letterIndex < this.letters.length;
    }

    getCurrentLetter() {
      return this.letters[this.letterIndex] || null;
    }

    startQuestion(correctAnswer) {
      this.correctAnswer = correctAnswer;
      this.isQuestionAnswered = false;
    }

    markQuestionAnswered() {
      this.isQuestionAnswered = true;
    }

    hasAnsweredQuestion() {
      return this.isQuestionAnswered;
    }

    getCorrectAnswer() {
      return this.correctAnswer;
    }

    isAnswerCorrect(answer) {
      return answer === this.correctAnswer;
    }

    advanceLetter() {
      this.letterIndex += 1;
    }
  }

  window.CurrentWordState = CurrentWordState;
}());
