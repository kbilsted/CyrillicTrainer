(function () {
  "use strict";

  function createSeed() {
    return String(Math.floor(Math.random() * 900000000) + 100000000);
  }

  function normalizeSeed(seedValue) {
    const parsed = Number.parseInt(seedValue, 10);
    return Number.isFinite(parsed) ? String(Math.abs(parsed)) : createSeed();
  }

  function ensureUrlSettings(defaultDataSetId, validDataSetIds) {
    const url = new URL(window.location.href);
    const existingSeed = url.searchParams.get("seed");
    const existingDataSetId = url.searchParams.get("data");
    const validIds = new Set(validDataSetIds);
    let changed = false;
    let seed = existingSeed ? normalizeSeed(existingSeed) : createSeed();
    let dataSetId = validIds.has(existingDataSetId) ? existingDataSetId : defaultDataSetId;

    if (seed !== existingSeed) {
      url.searchParams.set("seed", seed);
      changed = true;
    }

    if (dataSetId !== existingDataSetId) {
      url.searchParams.set("data", dataSetId);
      changed = true;
    }

    if (changed) {
      window.location.replace(url.toString());
    }

    return { seed, dataSetId };
  }

  function ensureSeed() {
    return ensureUrlSettings("1", ["1"]).seed;
  }

  function switchDataSet(dataSetId) {
    const url = new URL(window.location.href);
    url.searchParams.set("data", dataSetId);
    window.location.assign(url.toString());
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

  window.CyrillicRandom = {
    ensureUrlSettings,
    ensureSeed,
    switchDataSet,
    createSeededRandom,
    choose,
    shuffleSeeded
  };
}());
