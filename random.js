// Module wrapper that publishes URL and seeded-random helpers.
// Called immediately by the browser when random.js is loaded.
(function () {
  "use strict";

  // Creates a new URL seed when none is provided or the provided seed is invalid.
  // Called by normalizeSeed and ensureUrlSettings.
  function createSeed() {
    return String(Math.floor(Math.random() * 900000000) + 100000000);
  }

  // Parses the URL seed into a positive integer string, falling back to a new seed.
  // Called only by ensureUrlSettings.
  function normalizeSeed(seedValue) {
    const parsed = Number.parseInt(seedValue, 10);
    return Number.isFinite(parsed) ? String(Math.abs(parsed)) : createSeed();
  }

  // Validates seed and data URL params, redirecting once if they need normalization.
  // Called only by CyrillicGame.init.
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

  // Legacy helper for seed-only callers; currently exported but unused by the app.
  function ensureSeed() {
    return ensureUrlSettings("1", ["1"]).seed;
  }

  // Updates the URL to use a different dataset and reloads the page.
  // Called only through the UI dataset-change callback.
  function switchDataSet(dataSetId) {
    const url = new URL(window.location.href);
    url.searchParams.set("data", dataSetId);
    window.location.assign(url.toString());
  }

  // Converts a seed string into a stable 32-bit state for the PRNG.
  // Called only by createSeededRandom.
  function hashSeed(seed) {
    let hash = 2166136261;
    const text = String(seed);

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  // Builds the deterministic random-number generator used for round choices.
  // Called only by CyrillicGame.init.
  function createSeededRandom(seed) {
    let state = hashSeed(seed);

    // Advances the PRNG state and returns a number in the half-open range [0, 1).
    // Called through helpers such as choose and shuffleSeeded.
    return function nextRandom() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Converts the seeded random value into an integer below maxExclusive.
  // Called by choose and shuffleSeeded.
  function randomInt(nextRandom, maxExclusive) {
    return Math.floor(nextRandom() * maxExclusive);
  }

  // Picks one value from a non-empty array using seeded randomness.
  // Called by game word, letter, and preferred-word selection.
  function choose(nextRandom, values) {
    return values[randomInt(nextRandom, values.length)];
  }

  // Returns a seeded shuffled copy without mutating the input array.
  // Called only by CyrillicGame.chooseOptions.
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
