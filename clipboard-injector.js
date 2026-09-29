(function () {
  'use strict';
  function forceBrowserDefault(e) {
    e.stopImmediatePropagation();
    return true;
  }
  ['copy', 'cut', 'paste'].forEach((eventName) => {
    document.addEventListener(eventName, forceBrowserDefault, true);
  });
})();
