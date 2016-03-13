'use strict';

var gulp = require('gulp');
var jade = require('gulp-jade');
var compass = require('gulp-compass');
var nano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var autoprefixer = require('gulp-autoprefixer');
var critical = require('critical');


var paths = {
    templates: 'app/views',
    templates_test: 'app/views/**/*.jade',
    templates_dist: 'dist',
    images: 'app/img',
    images_test: 'app/imgs/**/*',
    images_dist: 'dist/imgs',
    sass: 'app/scss',
    sass_test: 'app/scss/**/*.scss',
    sass_dist: 'dist/css',
    critical_base: 'dist/',
    critical_src: 'index.html',
    critical_dist: 'dist/index-critical.html'
};


gulp.task('templates', function () {
    return gulp.src(paths.templates_test)
        .pipe(jade())
        .pipe(gulp.dest(paths.templates_dist));
});

gulp.task('images', function () {
    return gulp.src(paths.images_test)
        .pipe(imagemin({optimizationLevel: 7}))
        .pipe(gulp.dest(paths.images_dist));
});

gulp.task('sass', function () {
    return gulp.src(paths.sass_test)
        .pipe(compass({
            sass: paths.sass,
            css: paths.sass_dist,
            image: paths.images_dist
        }))
        .pipe(autoprefixer({
            browsers: ['> 1%', 'IE 7'],
            cascade: true
        }))
        .pipe(nano())
        .pipe(gulp.dest(paths.sass_dist));
});

gulp.task('critical', ['build'], function () {
    critical.generate({
        inline: true,
        base: paths.critical_base,
        src: paths.critical_src,
        dest: paths.critical_dist,
        width: 1300,
        height: 900,
        //inlineImages: true,
        minify: true,
        ignore: ['@font-face',/url\(/]
    });
});

gulp.task('watch', function () {
    gulp.watch(paths.templates_test, ['critical']);
    gulp.watch(paths.images_test, ['critical']);
    gulp.watch(paths.sass_test, ['critical']);
});

gulp.task('build', ['watch', 'templates', 'images', 'sass']);