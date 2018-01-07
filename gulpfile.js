'use strict';

const
    fs = require('fs'),
    gulp = require('gulp'),
    pump = require('pump'),
    pug = require('gulp-pug'),
    sass = require('gulp-sass'),
    webp = require('gulp-webp'),
    uncss = require('gulp-uncss'),
    uglify = require('gulp-uglify'),
    pkg = require('./package.json'),
    concat = require('gulp-concat'),
    merge = require('merge-stream'),
    rename = require('gulp-rename'),
    htmlmin = require('gulp-htmlmin'),
    compass = require('gulp-compass'),
    replace = require('gulp-replace'),
    imagemin = require('gulp-imagemin'),
    cleanCSS = require('gulp-clean-css'),
    replaceTask = require('gulp-replace-task'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create();

var paths = {
    templates__test: 'app/views/**/*.pug',
    templates_pages__test: 'app/views/pages/*.pug',
    templates_html__test: 'dist/**/*.html',
    templates_html__dist: 'dist',
    images__test: 'app/img/**/*',
    images__dist: 'dist/img',
    css__test: 'app/css/**/*.css',
    css__dist: 'dist/css',
    sass: 'app/scss',
    sass__test: 'app/scss/**/*.scss',
    sass__dist: '.tmp/css',
    fonts__test: 'app/fonts/**/*',
    fonts__dist: 'dist/fonts',
    js__test: 'app/js/**/*.js',
    js__dist: 'dist/js',
    js__dist_filename: 'app.js',
    other__test: 'app/*',
    other__dist: 'dist',
    all_test: 'dist/**/*',
    all_dist: 'dist'
};

// Static server
gulp.task('serve', ['compile'], function() {
    browserSync
        .init({
            server: {
                baseDir: 'dist'
            }
        });

    gulp.watch(paths.js__test, ['js']);
    gulp.watch(paths.images__test, ['images']);
    gulp.watch(paths.fonts__test, ['fonts__copy']);
    gulp.watch(paths.other__test, ['other__copy']);
    gulp.watch(paths.templates__test, ['templates__compile']);
    gulp.watch([paths.css__test, paths.sass__test], ['css__compile']);
});

gulp.task('compile', ['js', 'images', 'fonts__copy', 'other__copy', 'templates__compile', 'css__compile']);

gulp.task('js', function () {
    return gulp.src(paths.js__test)
    // .pipe(uglify())
        .pipe(concat(paths.js__dist_filename))
        .pipe(gulp.dest(paths.js__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images', ['images_default__optimize', 'images_webp__optimize']);

gulp.task('images_webp__optimize', function () {
    return gulp.src(paths.images__test)
        .pipe(rename(function (path) {
            path.extname += path.extname == '.png' || path.extname == '.jpg' ? path.extname : '';
        }))
        .pipe(webp({
            'method': 6
        }))
        .pipe(gulp.dest(paths.images__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images_default__optimize', function () {
    return gulp.src(paths.images__test)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.images__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('fonts__copy', function () {
    return gulp.src(paths.fonts__test)
        .pipe(gulp.dest(paths.fonts__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('css__compile', function () {
    var sassStream,
        cssStream;

    sassStream = gulp.src(paths.sass__test)
        .pipe(compass({
            project: __dirname,
            css: paths.sass__dist,
            sass: paths.sass,
            image: paths.images
        }))
        // .pipe(uncss({
        //     html: [paths.templates_html__test],
        //     ignore: [new RegExp('amp*'), new RegExp('wp__*'), '.hidden']
        // }))
        .pipe(cleanCSS({
            compatibility: 'ie8',
            advanced: true,
            roundingPrecision: -1
        }))
        .on('error', function (error) {
            console.error('' + error);
        });

    cssStream =
        gulp.src(paths.css__test)
            .on('error', function (error) {
                console.error('' + error);
            });

    return merge(cssStream, sassStream)
        .pipe(autoprefixer({
            browsers: ['> 3%', 'IE 8'],
            cascade: true
        }))
        .pipe(concat('app.css'))
        .pipe(replace('@charset "UTF-8";', ''))
        .pipe(replaceTask({
            patterns: [
                {
                    match: 'timestamp',
                    replacement: new Date().getTime()
                },
                {
                    match: 'version',
                    replacement: pkg.version
                }
            ]
        }))
        .pipe(gulp.dest(paths.css__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('templates__compile', function () {
    return gulp.src(paths.templates_pages__test)
        .pipe(pug())
        .pipe(htmlmin({
            minifyURLs: true,
            sortAttributes: true,
            sortClassName: true,
            useShortDoctype: true,
            removeAttributeQuotes: true,
            quoteCharacter: '\"',
            minifyJS: true
        }))
        .pipe(replaceTask({
            patterns: [
                {
                    match: 'timestamp',
                    replacement: new Date().getTime()
                },
                {
                    match: 'version',
                    replacement: pkg.version
                }
            ]
        }))
        .pipe(gulp.dest(paths.templates_html__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('other__copy', function () {
    gulp.src(paths.other__test)
        .pipe(gulp.dest(paths.other__dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});