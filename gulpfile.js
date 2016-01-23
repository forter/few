'use strict';

var browserify = require('browserify');
var rename = require("gulp-rename")
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var inject = require('gulp-inject-string');
var fs = require("fs");



/**
 * Move main index.js to dist (for node)
 */
gulp.task('dist', function () {
  return gulp.src('index.js')
    .pipe(gulp.dest('./dist/'));
});

/**
 * Wrapper for none browserify module into index.browser.js (for browsers)
 */
 gulp.task('wrapper', function () {
   var indexJsContet = fs.readFileSync("index.js", "utf8");
   return gulp.src('./build/wrapper.js')
     .pipe(inject.replace('// inject:index.js', indexJsContet))
     .pipe(rename('index.browser.js'))
     .pipe(gulp.dest('./dist/'));
});

/**
 * Build me..
 * browserify into index.browserify.js (for browsers)
 */
gulp.task('build' ,['dist', 'wrapper'], function () {
  var b = browserify({
    entries: './index.js',
    debug: true,
  });
  return b.bundle()
    .pipe(source('index.js'))
    .pipe(rename('index.browserify.js'))
    .pipe(gulp.dest('./dist/'));
});
