(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
'use strict';

function isFunction(v) {
  return typeof v === 'function';
}

function isThenable(v) {
  return typeof v === 'object' && typeof v.then === 'function';
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
  return cb => t.then(v => cb(null, v), err => cb(err));
}

function generatorToFunction(gen) {
  return cb => advance(gen, cb);
}

function elementToFunction(e) {
  return isGenerator(e) ? generatorToFunction(e) :
      valueToFunction(e);
}

function valueToFunction(v) {
  return isFunction(v) ? v :
      isThenable(v) ? thenableToFunction(v) :
      Array.isArray(v) ? arrayToFunction(v) :
      isObject(v) ? objectToFunction(v) :
      cb => process.nextTick(() => cb(null, v));
}

function arrayToFunction(arr) {
  return iterableToFunction(
      () => new Array(arr.length),
      cb => arr.forEach(cb),
      count => count === arr.length);
}


function objectToFunction(o) {
  const keys = Object.keys(o);
  return iterableToFunction(
      () => Object.assign({}, o),
      cb => keys.forEach(k => cb(o[k], k)),
      count => count === keys.length);
}

function iterableToFunction(createDest, iterate, hasFinished) {
  return function (cb) {
    const dest = createDest();
    let count = 0;
    let stopIteration = false;
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
    const r = err ? gen.throw(err) : gen.next(result);
    return r.done ? cb(null, r.value) :
        valueToFunction(r.value)((fnErr, fnResult) => advance(gen, cb, fnErr, fnResult));
  } catch (genErr) {
    return cb(genErr);
  }
}

class ErrorGenerator {
  next() {
    throw new TypeError('genOrFn must be a generator or a generator function');
  }
}

function few(genOrFn, cb) {
  advance(
    isGenerator(genOrFn) ? genOrFn :
      isGeneratorFunction(genOrFn) ? genOrFn() :
        new ErrorGenerator(),
    isFunction(cb) ? cb : err => { if (err) process.nextTick(() => { throw err; }); });
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odikge1xuICByZXR1cm4gdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzVGhlbmFibGUodikge1xuICByZXR1cm4gdHlwZW9mIHYgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2LnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzR2VuZXJhdG9yRnVuY3Rpb24odikge1xuICByZXR1cm4gaXNGdW5jdGlvbih2KSAmJiB2LmNvbnN0cnVjdG9yLm5hbWUgPT09ICdHZW5lcmF0b3JGdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG8pIHtcbiAgcmV0dXJuIG8gaW5zdGFuY2VvZiBPYmplY3Q7XG59XG5cbmZ1bmN0aW9uIGlzR2VuZXJhdG9yKHYpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHYpICYmIGlzRnVuY3Rpb24odi5uZXh0KSAmJiBpc0Z1bmN0aW9uKHYudGhyb3cpO1xufVxuXG5mdW5jdGlvbiB0aGVuYWJsZVRvRnVuY3Rpb24odCkge1xuICByZXR1cm4gY2IgPT4gdC50aGVuKHYgPT4gY2IobnVsbCwgdiksIGVyciA9PiBjYihlcnIpKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdG9yVG9GdW5jdGlvbihnZW4pIHtcbiAgcmV0dXJuIGNiID0+IGFkdmFuY2UoZ2VuLCBjYik7XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRUb0Z1bmN0aW9uKGUpIHtcbiAgcmV0dXJuIGlzR2VuZXJhdG9yKGUpID8gZ2VuZXJhdG9yVG9GdW5jdGlvbihlKSA6XG4gICAgICB2YWx1ZVRvRnVuY3Rpb24oZSk7XG59XG5cbmZ1bmN0aW9uIHZhbHVlVG9GdW5jdGlvbih2KSB7XG4gIHJldHVybiBpc0Z1bmN0aW9uKHYpID8gdiA6XG4gICAgICBpc1RoZW5hYmxlKHYpID8gdGhlbmFibGVUb0Z1bmN0aW9uKHYpIDpcbiAgICAgIEFycmF5LmlzQXJyYXkodikgPyBhcnJheVRvRnVuY3Rpb24odikgOlxuICAgICAgaXNPYmplY3QodikgPyBvYmplY3RUb0Z1bmN0aW9uKHYpIDpcbiAgICAgIGNiID0+IHByb2Nlc3MubmV4dFRpY2soKCkgPT4gY2IobnVsbCwgdikpO1xufVxuXG5mdW5jdGlvbiBhcnJheVRvRnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBpdGVyYWJsZVRvRnVuY3Rpb24oXG4gICAgICAoKSA9PiBuZXcgQXJyYXkoYXJyLmxlbmd0aCksXG4gICAgICBjYiA9PiBhcnIuZm9yRWFjaChjYiksXG4gICAgICBjb3VudCA9PiBjb3VudCA9PT0gYXJyLmxlbmd0aCk7XG59XG5cblxuZnVuY3Rpb24gb2JqZWN0VG9GdW5jdGlvbihvKSB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvKTtcbiAgcmV0dXJuIGl0ZXJhYmxlVG9GdW5jdGlvbihcbiAgICAgICgpID0+IE9iamVjdC5hc3NpZ24oe30sIG8pLFxuICAgICAgY2IgPT4ga2V5cy5mb3JFYWNoKGsgPT4gY2Iob1trXSwgaykpLFxuICAgICAgY291bnQgPT4gY291bnQgPT09IGtleXMubGVuZ3RoKTtcbn1cblxuZnVuY3Rpb24gaXRlcmFibGVUb0Z1bmN0aW9uKGNyZWF0ZURlc3QsIGl0ZXJhdGUsIGhhc0ZpbmlzaGVkKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoY2IpIHtcbiAgICBjb25zdCBkZXN0ID0gY3JlYXRlRGVzdCgpO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IHN0b3BJdGVyYXRpb24gPSBmYWxzZTtcbiAgICBpdGVyYXRlKGZ1bmN0aW9uIChlLCBpKSB7XG4gICAgICBlbGVtZW50VG9GdW5jdGlvbihlKShmdW5jdGlvbiAoZXJyLCB2YWx1ZSkge1xuICAgICAgICBpZiAoc3RvcEl0ZXJhdGlvbikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZXN0W2ldID0gdmFsdWU7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICAgIGlmIChlcnIgfHwgaGFzRmluaXNoZWQoY291bnQpKSB7XG4gICAgICAgICAgY2IoZXJyLCBkZXN0KTtcbiAgICAgICAgICBzdG9wSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkdmFuY2UoZ2VuLCBjYiwgZXJyLCByZXN1bHQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gZXJyID8gZ2VuLnRocm93KGVycikgOiBnZW4ubmV4dChyZXN1bHQpO1xuICAgIHJldHVybiByLmRvbmUgPyBjYihudWxsLCByLnZhbHVlKSA6XG4gICAgICAgIHZhbHVlVG9GdW5jdGlvbihyLnZhbHVlKSgoZm5FcnIsIGZuUmVzdWx0KSA9PiBhZHZhbmNlKGdlbiwgY2IsIGZuRXJyLCBmblJlc3VsdCkpO1xuICB9IGNhdGNoIChnZW5FcnIpIHtcbiAgICByZXR1cm4gY2IoZ2VuRXJyKTtcbiAgfVxufVxuXG5jbGFzcyBFcnJvckdlbmVyYXRvciB7XG4gIG5leHQoKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZ2VuT3JGbiBtdXN0IGJlIGEgZ2VuZXJhdG9yIG9yIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmV3KGdlbk9yRm4sIGNiKSB7XG4gIGFkdmFuY2UoXG4gICAgaXNHZW5lcmF0b3IoZ2VuT3JGbikgPyBnZW5PckZuIDpcbiAgICAgIGlzR2VuZXJhdG9yRnVuY3Rpb24oZ2VuT3JGbikgPyBnZW5PckZuKCkgOlxuICAgICAgICBuZXcgRXJyb3JHZW5lcmF0b3IoKSxcbiAgICBpc0Z1bmN0aW9uKGNiKSA/IGNiIDogZXJyID0+IHsgaWYgKGVycikgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7IHRocm93IGVycjsgfSk7IH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZldztcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIl19
