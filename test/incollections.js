'use strict';

const test = require('tape');

const few = require('../index');

function testCollectionInCollection(resolving, rejecting) {
  return function (t) {
    const expected = [Symbol(), [Symbol()]];
    t.plan(2);
    few(resolving(expected), (err, actual) => t.same(actual, expected));
    few(rejecting(expected), (actual) => t.same(actual, expected[0]));
  };
}

test('yielding a collection of promises', testCollectionInCollection(
    function* resolving(c) { return yield [Promise.resolve(c[0]), [Promise.resolve(c[1][0])]]; },
    function* rejecting(c) { yield [[Promise.reject(c[0])], Promise.resolve(c[1])]; }));

const resolvingFunction = v => cb => process.nextTick(() => cb(null, v));
const rejectingFunction = v => cb => process.nextTick(() => cb(v));
test('yielding a collection of functions', testCollectionInCollection(
  function* resolving(c) { return yield [resolvingFunction(c[0]), [resolvingFunction(c[1][0])]]; },
  function* rejecting(c) { yield [[rejectingFunction(c[0])], resolvingFunction(c[1])]; }));

test('yielding a collection of values', testCollectionInCollection(
  function* resolving(c) { return yield c; },
  function* rejecting(c) { throw yield c[0]; }));

test('returning a collection of values', testCollectionInCollection(
  function* resolving(c) { yield; return c; },
  function* rejecting(c) { yield; throw c[0]; }));
