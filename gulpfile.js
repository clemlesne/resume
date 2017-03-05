'use strict';

const
    fs = require('fs'),
    gulp = require('gulp'),
    pug = require('gulp-pug'),
    data = require('gulp-data'),
    sass = require('gulp-sass'),
    webp = require('gulp-webp'),
    csso = require('gulp-csso'),
    uncss = require('gulp-uncss'),
    gs = require('gulp-selectors'),
    pkg = require('./package.json'),
    concat = require('gulp-concat'),
    merge = require('merge-stream'),
    rename = require('gulp-rename'),
    htmlmin = require('gulp-htmlmin'),
    compass = require('gulp-compass'),
    replace = require('gulp-replace'),
    imagemin = require('gulp-imagemin'),
    cleanCSS = require('gulp-clean-css'),
    shorthand = require('gulp-shorthand'),
    replaceTask = require('gulp-replace-task'),
    autoprefixer = require('gulp-autoprefixer'),
    minifyInline = require('gulp-minify-inline'),
    browserSync = require('browser-sync').create();

var paths = {
    templates_compile_data: 'app/views/data.json',
    templates_compile_test: 'app/views/**/*.pug',
    templates_compile_test_pages: 'app/views/pages/*.pug',
    templates_tmp: '.tmp',
    templates_tmp_test: '.tmp/*.html',
    templates_dest: 'dist',
    images_compile_test: 'app/img/**/*',
    images_dist: 'dist/img',
    css_compile: 'app/css',
    css_compile_test: 'app/css/**/*.css',
    css_tmp: '.tmp/css',
    css_tmp_test: '.tmp/css/*.css',
    sass_compile: 'app/scss',
    sass_compile_test: 'app/scss/**/*.scss',
    sass_tmp: '.tmp/css',
    dist: 'dist',
    tmp_selectors: ['.tmp/css/app.css', '.tmp/*.html', '!.tmp/_.html']
};

// Static server
gulp.task('serve', ['compile'], function() {
    browserSync
        .init({
            server: {
                baseDir: paths.dist
            }
        });

    gulp.watch(paths.images_compile_test, ['images:copy']);
    gulp.watch([paths.templates_compile_test, paths.sass_compile_test, paths.css_compile_test, paths.sass_compile_test], ['html:selectors']);
});

gulp.task('compile', ['html:selectors', 'images:copy']);

gulp.task('html:selectors', ['html:annotations'], function () {

    gulp.src(paths.tmp_selectors)
        .pipe(gs.run({
            'css': ['css'],
            'html': ['html']
        }, {
            classes: ['fa*'],
            ids: '*'
        }))
        .pipe(gulp.dest(paths.templates_dest))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('html:annotations', ['html:compile'], function () {
    return gulp.src(paths.templates_tmp_test)
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
        .pipe(minifyInline())
        .pipe(htmlmin({
            useShortDoctype: true,
            sortClassName: true,
            sortAttributes: true,
            removeRedundantAttributes: true,
            removeComments: true,
            quoteCharacter: '"'
        }))
        .pipe(gulp.dest(paths.templates_tmp))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('html:compile', ['css:compile'], function () {
    return gulp.src(paths.templates_compile_test_pages)
        .pipe(data(function(file) {
            return JSON.parse(
                fs.readFileSync(paths.templates_compile_data)
            );
        }))
        .pipe(pug())
        .pipe(gulp.dest(paths.templates_tmp))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('css:compile', function () {
    var sassStream,
        cssStream;

    sassStream = gulp.src(paths.sass_compile_test)
        .pipe(compass({
            project: __dirname,
            css: paths.css_tmp,
            sass: paths.sass_compile
        }))
        .pipe(uncss({
            html: [paths.templates_tmp_test]
        }))
        .pipe(shorthand())
        .on('error', function (error) {
            console.error('' + error);
        });

    cssStream =
        gulp.src(paths.css_compile_test)
            .on('error', function (error) {
                console.error('' + error);
            });

    return merge(cssStream, sassStream)
        .pipe(autoprefixer({
            browsers: ['> 3%', 'IE 8'],
            cascade: true
        }))
        .pipe(cleanCSS({
            compatibility: 'ie8',
            advanced: true,
            roundingPrecision: -1
        }))
        .pipe(concat('app.css'))
        .pipe(replace('@charset "UTF-8";', ''))
        .pipe(csso())
        .pipe(gulp.dest(paths.css_tmp))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images:copy', ['images:compile:standard', 'images:compile:webp']);

gulp.task('images:compile:standard', function () {
    return gulp.src(paths.images_compile_test)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.images_dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images:compile:webp', function () {
    return gulp.src(paths.images_compile_test)
        .pipe(rename(function (path) {
            path.extname += path.extname == '.png' || path.extname == '.jpg' ? path.extname : '';
        }))
        .pipe(webp({
            'method': 6
        }))
        .pipe(gulp.dest(paths.images_dist))
        .pipe(browserSync.stream())
        .on('error', function (error) {
            console.error('' + error);
        });
});