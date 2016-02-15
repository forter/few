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

function valueToFunction(v) {
  return isGeneratorFunction(v) ? generatorToFunction(v()) :
    isFunction(v) ? v :
      isGenerator(v) ? generatorToFunction(v) :
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
