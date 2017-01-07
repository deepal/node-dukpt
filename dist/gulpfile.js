'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');

function lint() {
    return gulp.src(['./index.js', './lib/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failOnError());
}

gulp.task('lint', lint);
//# sourceMappingURL=gulpfile.js.map