(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.few = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isFunction(v) {
  return typeof v === 'function';
}

function isThenable(v) {
  return (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object' && typeof v.then === 'function';
}

function isGeneratorFunction(v) {
  return isFunction(v) && v.constructor.name === 'GeneratorFunction';
}

function isObject(o) {
  return o instanceof Object;
}

function isGenerator(v) {
  return isObject(v) && isFunction(v.next) && isFunction(v.throw);
}

function thenableToFunction(t) {
  return function (cb) {
    return t.then(function (v) {
      return cb(null, v);
    }, function (err) {
      return cb(err);
    });
  };
}

function generatorToFunction(gen) {
  return function (cb) {
    return advance(gen, cb);
  };
}

function elementToFunction(e) {
  return isGenerator(e) ? generatorToFunction(e) : valueToFunction(e);
}

function valueToFunction(v) {
  return isFunction(v) ? v : isThenable(v) ? thenableToFunction(v) : Array.isArray(v) ? arrayToFunction(v) : isObject(v) ? objectToFunction(v) : function (cb) {
    return process.nextTick(function () {
      return cb(null, v);
    });
  };
}

function arrayToFunction(arr) {
  return iterableToFunction(function () {
    return new Array(arr.length);
  }, function (cb) {
    return arr.forEach(cb);
  }, function (count) {
    return count === arr.length;
  });
}

function objectToFunction(o) {
  var keys = Object.keys(o);
  return iterableToFunction(function () {
    return Object.assign({}, o);
  }, function (cb) {
    return keys.forEach(function (k) {
      return cb(o[k], k);
    });
  }, function (count) {
    return count === keys.length;
  });
}

function iterableToFunction(createDest, iterate, hasFinished) {
  return function (cb) {
    var dest = createDest();
    var count = 0;
    var stopIteration = false;
    iterate(function (e, i) {
      elementToFunction(e)(function (err, value) {
        if (stopIteration) {
          return;
        }
        dest[i] = value;
        count += 1;
        if (err || hasFinished(count)) {
          cb(err, dest);
          stopIteration = true;
        }
      });
    });
  };
}

function advance(gen, cb, err, result) {
  try {
    var r = err ? gen.throw(err) : gen.next(result);
    return r.done ? cb(null, r.value) : valueToFunction(r.value)(function (fnErr, fnResult) {
      return advance(gen, cb, fnErr, fnResult);
    });
  } catch (genErr) {
    return cb(genErr);
  }
}

var ErrorGenerator = function () {
  function ErrorGenerator() {
    _classCallCheck(this, ErrorGenerator);
  }

  _createClass(ErrorGenerator, [{
    key: 'next',
    value: function next() {
      throw new TypeError('genOrFn must be a generator or a generator function');
    }
  }]);

  return ErrorGenerator;
}();

function few(genOrFn, cb) {
  advance(isGenerator(genOrFn) ? genOrFn : isGeneratorFunction(genOrFn) ? genOrFn() : new ErrorGenerator(), isFunction(cb) ? cb : function (err) {
    if (err) process.nextTick(function () {
      throw err;
    });
  });
}

module.exports = few;
}).call(this,require('_process'))

},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc1RoZW5hYmxlKHYpIHtcbiAgcmV0dXJuICh0eXBlb2YgdiA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YodikpID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygdi50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc0dlbmVyYXRvckZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIGlzRnVuY3Rpb24odikgJiYgdi5jb25zdHJ1Y3Rvci5uYW1lID09PSAnR2VuZXJhdG9yRnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gIHJldHVybiBvIGluc3RhbmNlb2YgT2JqZWN0O1xufVxuXG5mdW5jdGlvbiBpc0dlbmVyYXRvcih2KSB7XG4gIHJldHVybiBpc09iamVjdCh2KSAmJiBpc0Z1bmN0aW9uKHYubmV4dCkgJiYgaXNGdW5jdGlvbih2LnRocm93KTtcbn1cblxuZnVuY3Rpb24gdGhlbmFibGVUb0Z1bmN0aW9uKHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiB0LnRoZW4oZnVuY3Rpb24gKHYpIHtcbiAgICAgIHJldHVybiBjYihudWxsLCB2KTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdG9yVG9GdW5jdGlvbihnZW4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiBhZHZhbmNlKGdlbiwgY2IpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBlbGVtZW50VG9GdW5jdGlvbihlKSB7XG4gIHJldHVybiBpc0dlbmVyYXRvcihlKSA/IGdlbmVyYXRvclRvRnVuY3Rpb24oZSkgOiB2YWx1ZVRvRnVuY3Rpb24oZSk7XG59XG5cbmZ1bmN0aW9uIHZhbHVlVG9GdW5jdGlvbih2KSB7XG4gIHJldHVybiBpc0Z1bmN0aW9uKHYpID8gdiA6IGlzVGhlbmFibGUodikgPyB0aGVuYWJsZVRvRnVuY3Rpb24odikgOiBBcnJheS5pc0FycmF5KHYpID8gYXJyYXlUb0Z1bmN0aW9uKHYpIDogaXNPYmplY3QodikgPyBvYmplY3RUb0Z1bmN0aW9uKHYpIDogZnVuY3Rpb24gKGNiKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiKG51bGwsIHYpO1xuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhcnJheVRvRnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBpdGVyYWJsZVRvRnVuY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7XG4gIH0sIGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiBhcnIuZm9yRWFjaChjYik7XG4gIH0sIGZ1bmN0aW9uIChjb3VudCkge1xuICAgIHJldHVybiBjb3VudCA9PT0gYXJyLmxlbmd0aDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvRnVuY3Rpb24obykge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG8pO1xuICByZXR1cm4gaXRlcmFibGVUb0Z1bmN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgbyk7XG4gIH0sIGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgIHJldHVybiBjYihvW2tdLCBrKTtcbiAgICB9KTtcbiAgfSwgZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgcmV0dXJuIGNvdW50ID09PSBrZXlzLmxlbmd0aDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGl0ZXJhYmxlVG9GdW5jdGlvbihjcmVhdGVEZXN0LCBpdGVyYXRlLCBoYXNGaW5pc2hlZCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIGRlc3QgPSBjcmVhdGVEZXN0KCk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICB2YXIgc3RvcEl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIGl0ZXJhdGUoZnVuY3Rpb24gKGUsIGkpIHtcbiAgICAgIGVsZW1lbnRUb0Z1bmN0aW9uKGUpKGZ1bmN0aW9uIChlcnIsIHZhbHVlKSB7XG4gICAgICAgIGlmIChzdG9wSXRlcmF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRlc3RbaV0gPSB2YWx1ZTtcbiAgICAgICAgY291bnQgKz0gMTtcbiAgICAgICAgaWYgKGVyciB8fCBoYXNGaW5pc2hlZChjb3VudCkpIHtcbiAgICAgICAgICBjYihlcnIsIGRlc3QpO1xuICAgICAgICAgIHN0b3BJdGVyYXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWR2YW5jZShnZW4sIGNiLCBlcnIsIHJlc3VsdCkge1xuICB0cnkge1xuICAgIHZhciByID0gZXJyID8gZ2VuLnRocm93KGVycikgOiBnZW4ubmV4dChyZXN1bHQpO1xuICAgIHJldHVybiByLmRvbmUgPyBjYihudWxsLCByLnZhbHVlKSA6IHZhbHVlVG9GdW5jdGlvbihyLnZhbHVlKShmdW5jdGlvbiAoZm5FcnIsIGZuUmVzdWx0KSB7XG4gICAgICByZXR1cm4gYWR2YW5jZShnZW4sIGNiLCBmbkVyciwgZm5SZXN1bHQpO1xuICAgIH0pO1xuICB9IGNhdGNoIChnZW5FcnIpIHtcbiAgICByZXR1cm4gY2IoZ2VuRXJyKTtcbiAgfVxufVxuXG52YXIgRXJyb3JHZW5lcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEVycm9yR2VuZXJhdG9yKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFcnJvckdlbmVyYXRvcik7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRXJyb3JHZW5lcmF0b3IsIFt7XG4gICAga2V5OiAnbmV4dCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdnZW5PckZuIG11c3QgYmUgYSBnZW5lcmF0b3Igb3IgYSBnZW5lcmF0b3IgZnVuY3Rpb24nKTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRXJyb3JHZW5lcmF0b3I7XG59KCk7XG5cbmZ1bmN0aW9uIGZldyhnZW5PckZuLCBjYikge1xuICBhZHZhbmNlKGlzR2VuZXJhdG9yKGdlbk9yRm4pID8gZ2VuT3JGbiA6IGlzR2VuZXJhdG9yRnVuY3Rpb24oZ2VuT3JGbikgPyBnZW5PckZuKCkgOiBuZXcgRXJyb3JHZW5lcmF0b3IoKSwgaXNGdW5jdGlvbihjYikgPyBjYiA6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmV3OyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIl19
