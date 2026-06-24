// Module wrapper for bootstrapping the static browser app.
// Called immediately by the browser when app.js is loaded.
(function () {
  "use strict";

  // Starts the game once jQuery reports that the DOM is ready.
  // Called only by jQuery's ready handler.
  window.jQuery(function () {
    window.CyrillicGame.init();
  });
}());
