(function () {
  "use strict";

  const RECENT_CORRECT_LETTER_LIMIT = 20;

  class UserProgressStats {
    constructor(values) {
      const nextValues = values || {};

      this.successCounter = Number(nextValues.successCounter) || 0;
      this.failCounter = Number(nextValues.failCounter) || 0;
      this.recentCorrectLetters = Array.isArray(nextValues.recentCorrectLetters)
        ? nextValues.recentCorrectLetters.filter((letter) => typeof letter === "string").slice(-RECENT_CORRECT_LETTER_LIMIT)
        : [];
      this.letterErrorCounts = UserProgressStats.cleanLetterErrorCounts(nextValues.letterErrorCounts);
      this.letterCorrectCounts = UserProgressStats.cleanLetterErrorCounts(nextValues.letterCorrectCounts);
    }

    static cleanLetterErrorCounts(letterErrorCounts) {
      if (!letterErrorCounts || typeof letterErrorCounts !== "object" || Array.isArray(letterErrorCounts)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(letterErrorCounts)
          .filter(([letter, count]) => typeof letter === "string" && Number(count) > 0)
          .map(([letter, count]) => [letter, Math.floor(Number(count))])
      );
    }

    static fromJSON(raw) {
      return new UserProgressStats(raw);
    }

    recordCorrectLetter(cyrillicLetter) {
      this.successCounter += 1;
      this.letterCorrectCounts[cyrillicLetter] = (this.letterCorrectCounts[cyrillicLetter] || 0) + 1;
      this.recentCorrectLetters.push(cyrillicLetter.toLowerCase());
      this.recentCorrectLetters.push(cyrillicLetter.toUpperCase());

      if (this.recentCorrectLetters.length > RECENT_CORRECT_LETTER_LIMIT) {
        this.recentCorrectLetters = this.recentCorrectLetters.slice(-RECENT_CORRECT_LETTER_LIMIT);
      }
    }

    recordWrongLetter(cyrillicLetter) {
      this.failCounter += 1;
      this.letterErrorCounts[cyrillicLetter] = (this.letterErrorCounts[cyrillicLetter] || 0) + 1;
    }

    wasRecentlyCorrect(cyrillicLetter) {
      return this.recentCorrectLetters.includes(cyrillicLetter);
    }

    getDisplayStats() {
      const total = this.successCounter + this.failCounter;
      const ratio = total === 0 ? 0 : (this.successCounter / total) * 100;

      return {
        successCounter: this.successCounter,
        failCounter: this.failCounter,
        successRatio: `${ratio.toFixed(1)}%`
      };
    }

    getLetterErrorCounts() {
      return { ...this.letterErrorCounts };
    }

    getLetterCorrectCounts() {
      return { ...this.letterCorrectCounts };
    }

    reset() {
      this.successCounter = 0;
      this.failCounter = 0;
      this.recentCorrectLetters = [];
      this.letterErrorCounts = {};
      this.letterCorrectCounts = {};
    }

    toJSON() {
      return {
        successCounter: this.successCounter,
        failCounter: this.failCounter,
        recentCorrectLetters: this.recentCorrectLetters.slice(),
        letterErrorCounts: this.getLetterErrorCounts(),
        letterCorrectCounts: this.getLetterCorrectCounts()
      };
    }
  }

  window.UserProgressStats = UserProgressStats;
}());
