'use strict';

const browserify = require('browserify');
const rename = require('gulp-rename');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const inject = require('gulp-inject-string');
const fs = require('fs');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

/**
 * Move main index.js to dist with babel transform to es2015
 * TODO: remove babel once FF is supporting let and class
 */
gulp.task('dist', function () {
  return gulp.src('index.js')
    .pipe(babel({
        presets: ['es2015']
      }))
    .pipe(gulp.dest('./dist/'));
});

/**
 * Browserify code
 */
gulp.task('browserify' ,['dist'], function () {
  const b = browserify({
    entries: './dist/index.js',
    standalone: 'few',
    debug: true,
  });
  return b.bundle()
    .pipe(source('./index.js'))
    .pipe(gulp.dest('./dist/'));
});

/**
 * Build minfiy code
 */
gulp.task('build' ,['browserify'], function () {
  return gulp.src('./dist/index.js')
    .pipe(sourcemaps.init())
    .pipe(uglify({ preserveComments: 'license' }))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('./dist/'));
});
