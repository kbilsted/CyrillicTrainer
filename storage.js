(function () {
  "use strict";

  const APP_STATE_KEY = "cyrillicTrainerAppState";
  const UserProgressStats = window.UserProgressStats;

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
      roundCounter: Number(rawState.roundCounter) || 0
    };
  }

  function save(state) {
    window.localStorage.setItem(APP_STATE_KEY, JSON.stringify({
      userProgressStats: state.userProgressStats,
      roundCounter: Number(state.roundCounter) || 0
    }));
  }

  window.CyrillicStorage = {
    load,
    save
  };
}());
