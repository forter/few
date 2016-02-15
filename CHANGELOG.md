## v1.2.0

* Support yielding a collection of generator functions without initiating them:
```javascript
yield [myGeneratorFunction, myGeneratorFunction()];  // Both works!
```

* Support yielding/delegating generator functions with a simple `yield`:
```javascript
// All of the below works!
yield* myGeneratorFunction();
yield myGeneratorFunction;
yield myGeneratorFunction();
```
`yield*` is still supported, it actually provides better performance by using a native delegation to the generator.

## v1.1.0

* Add browser support with browserify

## v1.0.0

* Original release
