(function () {
  "use strict";

  window.jQuery(function () {
    const app = window.CyrillicFrontPage || window.CyrillicGame;

    if (!app) {
      throw new Error("Missing Cyrillic app module");
    }

    app.init();
  });
}());
