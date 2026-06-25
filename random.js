(function () {
  "use strict";

  function hashSeed(seed) {
    let hash = 2166136261;
    const text = String(seed);

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    let state = hashSeed(seed);

    return function nextRandom() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomInt(nextRandom, maxExclusive) {
    return Math.floor(nextRandom() * maxExclusive);
  }

  function choose(nextRandom, values) {
    return values[randomInt(nextRandom, values.length)];
  }

  function shuffleSeeded(nextRandom, values) {
    const shuffled = values.slice();

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(nextRandom, index + 1);
      const current = shuffled[index];
      shuffled[index] = shuffled[swapIndex];
      shuffled[swapIndex] = current;
    }

    return shuffled;
  }

  window.CyrillicRandom = {
    createSeededRandom,
    choose,
    shuffleSeeded
  };
}());
