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

function valueToFunction(v) {
  return isGeneratorFunction(v) ? generatorToFunction(v()) : isGenerator(v) ? generatorToFunction(v) : isFunction(v) ? v : isThenable(v) ? thenableToFunction(v) : Array.isArray(v) ? arrayToFunction(v) : isObject(v) ? objectToFunction(v) : function (cb) {
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
      valueToFunction(e)(function (err, value) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbih2KSB7XG4gIHJldHVybiB0eXBlb2YgdiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNUaGVuYWJsZSh2KSB7XG4gIHJldHVybiAodHlwZW9mIHYgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKHYpKSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHYudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNHZW5lcmF0b3JGdW5jdGlvbih2KSB7XG4gIHJldHVybiBpc0Z1bmN0aW9uKHYpICYmIHYuY29uc3RydWN0b3IubmFtZSA9PT0gJ0dlbmVyYXRvckZ1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3Qobykge1xuICByZXR1cm4gbyBpbnN0YW5jZW9mIE9iamVjdDtcbn1cblxuZnVuY3Rpb24gaXNHZW5lcmF0b3Iodikge1xuICByZXR1cm4gaXNPYmplY3QodikgJiYgaXNGdW5jdGlvbih2Lm5leHQpICYmIGlzRnVuY3Rpb24odi50aHJvdyk7XG59XG5cbmZ1bmN0aW9uIHRoZW5hYmxlVG9GdW5jdGlvbih0KSB7XG4gIHJldHVybiBmdW5jdGlvbiAoY2IpIHtcbiAgICByZXR1cm4gdC50aGVuKGZ1bmN0aW9uICh2KSB7XG4gICAgICByZXR1cm4gY2IobnVsbCwgdik7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRvclRvRnVuY3Rpb24oZ2VuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoY2IpIHtcbiAgICByZXR1cm4gYWR2YW5jZShnZW4sIGNiKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdmFsdWVUb0Z1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIGlzR2VuZXJhdG9yRnVuY3Rpb24odikgPyBnZW5lcmF0b3JUb0Z1bmN0aW9uKHYoKSkgOiBpc0dlbmVyYXRvcih2KSA/IGdlbmVyYXRvclRvRnVuY3Rpb24odikgOiBpc0Z1bmN0aW9uKHYpID8gdiA6IGlzVGhlbmFibGUodikgPyB0aGVuYWJsZVRvRnVuY3Rpb24odikgOiBBcnJheS5pc0FycmF5KHYpID8gYXJyYXlUb0Z1bmN0aW9uKHYpIDogaXNPYmplY3QodikgPyBvYmplY3RUb0Z1bmN0aW9uKHYpIDogZnVuY3Rpb24gKGNiKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiKG51bGwsIHYpO1xuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhcnJheVRvRnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBpdGVyYWJsZVRvRnVuY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7XG4gIH0sIGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiBhcnIuZm9yRWFjaChjYik7XG4gIH0sIGZ1bmN0aW9uIChjb3VudCkge1xuICAgIHJldHVybiBjb3VudCA9PT0gYXJyLmxlbmd0aDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvRnVuY3Rpb24obykge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG8pO1xuICByZXR1cm4gaXRlcmFibGVUb0Z1bmN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgbyk7XG4gIH0sIGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgIHJldHVybiBjYihvW2tdLCBrKTtcbiAgICB9KTtcbiAgfSwgZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgcmV0dXJuIGNvdW50ID09PSBrZXlzLmxlbmd0aDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGl0ZXJhYmxlVG9GdW5jdGlvbihjcmVhdGVEZXN0LCBpdGVyYXRlLCBoYXNGaW5pc2hlZCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIGRlc3QgPSBjcmVhdGVEZXN0KCk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICB2YXIgc3RvcEl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIGl0ZXJhdGUoZnVuY3Rpb24gKGUsIGkpIHtcbiAgICAgIHZhbHVlVG9GdW5jdGlvbihlKShmdW5jdGlvbiAoZXJyLCB2YWx1ZSkge1xuICAgICAgICBpZiAoc3RvcEl0ZXJhdGlvbikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZXN0W2ldID0gdmFsdWU7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICAgIGlmIChlcnIgfHwgaGFzRmluaXNoZWQoY291bnQpKSB7XG4gICAgICAgICAgY2IoZXJyLCBkZXN0KTtcbiAgICAgICAgICBzdG9wSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkdmFuY2UoZ2VuLCBjYiwgZXJyLCByZXN1bHQpIHtcbiAgdHJ5IHtcbiAgICB2YXIgciA9IGVyciA/IGdlbi50aHJvdyhlcnIpIDogZ2VuLm5leHQocmVzdWx0KTtcbiAgICByZXR1cm4gci5kb25lID8gY2IobnVsbCwgci52YWx1ZSkgOiB2YWx1ZVRvRnVuY3Rpb24oci52YWx1ZSkoZnVuY3Rpb24gKGZuRXJyLCBmblJlc3VsdCkge1xuICAgICAgcmV0dXJuIGFkdmFuY2UoZ2VuLCBjYiwgZm5FcnIsIGZuUmVzdWx0KTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZ2VuRXJyKSB7XG4gICAgcmV0dXJuIGNiKGdlbkVycik7XG4gIH1cbn1cblxudmFyIEVycm9yR2VuZXJhdG9yID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFcnJvckdlbmVyYXRvcigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXJyb3JHZW5lcmF0b3IpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEVycm9yR2VuZXJhdG9yLCBbe1xuICAgIGtleTogJ25leHQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZ2VuT3JGbiBtdXN0IGJlIGEgZ2VuZXJhdG9yIG9yIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uJyk7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEVycm9yR2VuZXJhdG9yO1xufSgpO1xuXG5mdW5jdGlvbiBmZXcoZ2VuT3JGbiwgY2IpIHtcbiAgYWR2YW5jZShpc0dlbmVyYXRvcihnZW5PckZuKSA/IGdlbk9yRm4gOiBpc0dlbmVyYXRvckZ1bmN0aW9uKGdlbk9yRm4pID8gZ2VuT3JGbigpIDogbmV3IEVycm9yR2VuZXJhdG9yKCksIGlzRnVuY3Rpb24oY2IpID8gY2IgOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZldzsiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiJdfQ==
