(function () {
  "use strict";

  class GameState {
    constructor(values) {
      const nextValues = values || {};

      this.roundCounter = Number(nextValues.roundCounter) || 1;
      this.wordOrder = Array.isArray(nextValues.wordOrder)
        ? nextValues.wordOrder.filter(Number.isInteger)
        : [];
      this.wordCursor = Number(nextValues.wordCursor) || 0;
      this.currentWordIndex = Number.isInteger(nextValues.currentWordIndex)
        ? nextValues.currentWordIndex
        : null;
      this.currentWordHadWrongAnswer = nextValues.currentWordHadWrongAnswer === true;
      this.gameOver = nextValues.gameOver === true;
      this.clampWordCursor();
    }

    static fromJSON(raw) {
      return new GameState(raw);
    }

    setWordOrder(wordOrder, wordSourceLength) {
      this.wordOrder = Array.isArray(wordOrder)
        ? wordOrder.filter(Number.isInteger)
        : [];
      this.clampWordCursor();

      if (
        !Number.isInteger(this.currentWordIndex)
        || this.currentWordIndex < 0
        || this.currentWordIndex >= wordSourceLength
      ) {
        this.currentWordIndex = null;
      }
    }

    reset(wordOrder) {
      if (Array.isArray(wordOrder)) {
        this.wordOrder = wordOrder.filter(Number.isInteger);
      }

      this.roundCounter = 1;
      this.wordCursor = 0;
      this.currentWordIndex = null;
      this.currentWordHadWrongAnswer = false;
      this.gameOver = false;
    }

    clampWordCursor() {
      this.wordCursor = Math.max(0, Math.min(this.wordCursor, this.wordOrder.length));
    }

    toJSON() {
      return {
        roundCounter: this.roundCounter,
        wordCursor: this.wordCursor,
        currentWordIndex: this.currentWordIndex,
        currentWordHadWrongAnswer: this.currentWordHadWrongAnswer,
        gameOver: this.gameOver
      };
    }
  }

  window.GameState = GameState;
}());
