#Changelog
## v1.2.0

* Support yielding array / object of generator functions without initiating them:
```javascript
yield [myGeneratorFunction, myGeneratorFunction()];  // Both works!
```

* Support yielding generator functions and initialized generators with a simple `yield`:
```javascript
// All of the below works!
yield* myGeneratorFunction();
yield myGeneratorFunction;
yield myGeneratorFunction();
```
`yield*` is still preferable since it performs a native delegation.

## v1.1.0

* Add browser support with browserify

## v1.0.0

* Initial release
