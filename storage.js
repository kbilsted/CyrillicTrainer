(function () {
  "use strict";

  const APP_STATE_KEY = "cyrillicTrainerAppState";
  const UserProgressStats = window.UserProgressStats;
  const GameState = window.GameState;

  function loadRawState() {
    try {
      const raw = window.localStorage.getItem(APP_STATE_KEY);

      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function load() {
    const rawState = loadRawState();

    return {
      userProgressStats: UserProgressStats.fromJSON(rawState.userProgressStats || {}),
      gameState: GameState.fromJSON(rawState.gameState || rawState)
    };
  }

  function save(state) {
    window.localStorage.setItem(APP_STATE_KEY, JSON.stringify({
      userProgressStats: state.userProgressStats,
      gameState: state.gameState
    }));
  }

  window.CyrillicStorage = {
    load,
    save
  };
}());
