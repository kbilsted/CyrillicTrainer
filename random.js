(function () {
  "use strict";

  function createSeed() {
    return String(Math.floor(Math.random() * 900000000) + 100000000);
  }

  function normalizeSeed(seedValue) {
    const parsed = Number.parseInt(seedValue, 10);
    return Number.isFinite(parsed) ? String(Math.abs(parsed)) : createSeed();
  }

  function ensureSeed() {
    const url = new URL(window.location.href);
    const existingSeed = url.searchParams.get("seed");

    if (existingSeed) {
      return normalizeSeed(existingSeed);
    }

    const seed = createSeed();
    url.searchParams.set("seed", seed);
    window.location.replace(url.toString());
    return seed;
  }

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

  function insertAtUnseeded(values, value) {
    const result = values.slice();
    const index = Math.floor(Math.random() * (result.length + 1));
    result.splice(index, 0, value);
    return result;
  }

  window.CyrillicRandom = {
    ensureSeed,
    createSeededRandom,
    choose,
    shuffleSeeded,
    insertAtUnseeded
  };
}());
