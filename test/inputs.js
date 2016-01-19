'use strict';

const test = require('tape');

const few = require('../index');

const expected = Symbol();

function testValue(genOrFn) {
  return function (t) {
    t.plan(1);
    few(genOrFn, (err, actual) => t.is(actual, expected));
  };
}

test('passing a generator function should pass value',
    testValue(function* () { return yield expected; }));

test('passing a generator should pass value',
    testValue((function* () { return yield expected; }())));

test('not passing a callback generator should not fail', function (t) {
  t.plan(1);
  few(function* () { return yield t.pass(); });
});

function assertTypeError(t) {
  return function (err) {
    t.is(err.constructor, TypeError);
    t.is(err.message, 'genOrFn must be a generator or a generator function');
  };
}

const OPTIONS = [undefined, null, {}, 1, ''];
test('passing a wrong type for generator and callback should trigger an error callback', function (t) {
  t.plan(OPTIONS.length * 2);
  const callback = assertTypeError(t);
  OPTIONS.forEach(o => few(o, callback));
});

test('passing a wrong type for generator and no callback should throw an error', function (t) {
  t.plan(OPTIONS.length * 2);
  process.on('uncaughtException', assertTypeError(t));
  OPTIONS.forEach(few);
  process.nextTick(() => process.removeAllListeners('uncaughtException'));
});
