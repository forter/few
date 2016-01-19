'use strict';

const test = require('tape');

const few = require('../index');

function testObject(resolving, rejecting) {
  return function (t) {
    const expected = {a: Symbol(), b: {c: Symbol()}};
    t.plan(2);
    few(resolving(expected), (err, actual) => t.same(actual, expected));
    few(rejecting(expected), (actual) => t.same(actual, expected.a));
  };
}

test('yielding an object of promises', testObject(
    function* resolving(o) { return yield {a: Promise.resolve(o.a), b: {c: Promise.resolve(o.b.c)}}; },
    function* rejecting(o) { yield {a: Promise.reject(o.a), b: {c: Promise.resolve(o.b.c)}}; }));

const resolvingFunction = v => cb => process.nextTick(() => cb(null, v));
const rejectingFunction = v => cb => process.nextTick(() => cb(v));

test('yielding an object of functions', testObject(
  function* resolving(o) { return yield {a: resolvingFunction(o.a), b: {c: resolvingFunction(o.b.c)}}; },
  function* rejecting(o) { yield {a: rejectingFunction(o.a), b: {c: resolvingFunction(o.b.c)}}; }));

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
  function* resolving(o) { return yield {a: resolvingGenertor(o.a), b: {c: resolvingGenertor(o.b.c)}}; },
  function* rejecting(o) { yield {a: rejectingGenertor(o.a), b: {c: resolvingGenertor(o.b.c)}}; }));

test('returning an object of values', testObject(
  function* resolving(o) { yield; return o; },
  function* rejecting(o) { yield; throw o.a; }));
