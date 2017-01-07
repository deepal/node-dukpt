'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');

function lint() {
    return gulp.src(['./index.js', './lib/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failOnError());
}

function pretest() {
    return gulp.src(['./index.js', './lib/*.js']).pipe(istanbul({ includeUntested: true })).pipe(istanbul.hookRequire());
}

function test() {
    return gulp.src(['./test/**/*.js'], { read: false }).pipe(mocha()).pipe(istanbul.writeReports({
        dir: 'test-coverage/',
        reportOpts: {
            dir: 'test-coverage/'
        },
        reporters: ['lcov', 'text', 'text-summary', 'cobertura']
    })).pipe(istanbul.enforceThresholds({ thresholds: { global: 1 } }));
}

function watch() {
    return gulp.watch(['./index.js', './lib/*.js'], 'test');
}

gulp.task('lint', lint);
gulp.task('pretest', pretest);
gulp.task('test', ['pretest'], test);
gulp.task('watch', watch);
//# sourceMappingURL=gulpfile.js.map