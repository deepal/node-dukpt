'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const coveralls = require('gulp-coveralls');
const path = require('path');
const fs = require('fs');

function lint() {
    return gulp.src(['./index.js', './lib/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
}

function pretest() {
    return gulp.src(['./index.js', './lib/*.js'])
        .pipe(istanbul({ includeUntested: true }))
        .pipe(istanbul.hookRequire());
}

function test() {
    gulp.src(['./test/**/*.js'], { read: false })
        .pipe(mocha())
        .pipe(istanbul.writeReports({
            dir: 'test-coverage/',
            reportOpts: {
                dir: 'test-coverage/'
            },
            reporters: ['lcov', 'text', 'text-summary', 'cobertura']
        }))
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 1 } }));
    return gulp.src('test-coverage/lcov.info')
        .pipe(coveralls());
}

function watch() {
    return gulp.watch(['./index.js', './lib/*.js'], 'test');
}

gulp.task('lint', lint);
gulp.task('pretest', pretest);
gulp.task('test', ['pretest'], test);
gulp.task('watch', watch);

gulp.task('default', ['test']);