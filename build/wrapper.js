(function(window){
 'use strict';
  if (!window || window.few) {
    throw "Few can't be registered to window.few";
  }

  // Monkey patch for process.nextTick
  const process = {
    nextTick: function(func) {
      return setTimeout(func, 0)
    }
  }
  // Monkey patch for module.exports
  var module = {
    exports: window.few
  }

  // inject:index.js

  window.few = module.exports;
})(window);
