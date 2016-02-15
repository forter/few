'use strict';

const test = require('tape');

const few = require('../index');

function testObject(resolving, rejecting) {
  return function (t) {
    const expected = {a: Symbol(), b: Symbol()};
    t.plan(2);
    few(resolving(expected), (err, actual) => t.same(actual, expected));
    few(rejecting(expected), (actual) => t.same(actual, expected.a));
  };
}

test('yielding an object of promises', testObject(
    function* resolving(o) { return yield {a: Promise.resolve(o.a), b: Promise.resolve(o.b)}; },
    function* rejecting(o) { yield {a: Promise.reject(o.a), b: Promise.resolve(o.b)}; }));

test('yielding an object of generator functions', testObject(
    function* resolving(o) { return yield {a: function* () {return o.a}, b: function* () {return o.b}}; },
    function* rejecting(o) { return yield {a: function* () {throw o.a}, b: function* () {throw o.b}}; }));

const resolvingFunction = v => cb => process.nextTick(() => cb(null, v));
const rejectingFunction = v => cb => process.nextTick(() => cb(v));

test('yielding an object of functions', testObject(
  function* resolving(o) { return yield {a: resolvingFunction(o.a), b: resolvingFunction(o.b)}; },
  function* rejecting(o) { yield {a: rejectingFunction(o.a), b: resolvingFunction(o.b)}; }));

test('yielding an object of values', testObject(
  function* resolving(o) { return yield o; },
  function* rejecting(o) { throw yield o.a; }));

function* resolvingGenertor(v) {
  return yield resolvingFunction(v);
}
function* rejectingGenertor(v) {
  return yield rejectingFunction(v);
}
test('yielding an object of generators', testObject(
  function* resolving(o) { return yield {a: resolvingGenertor(o.a), b: resolvingGenertor(o.b)}; },
  function* rejecting(o) { yield {a: rejectingGenertor(o.a), b: resolvingGenertor(o.b)}; }));

test('returning an object of values', testObject(
  function* resolving(o) { yield; return o; },
  function* rejecting(o) { yield; throw o.a; }));

test('object keys preserve order', function (t) {
    t.plan(1);
    few(function* () {
        return yield {a: cb => process.nextTick(() => cb(null, 1)), b: cb => cb(null, 2)};
    }, (err, actual) => t.same(Object.keys(actual), ['a', 'b']));
});
