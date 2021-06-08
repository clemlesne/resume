const
    fs = require('fs'),
    gulp = require('gulp'),
    http = require('http'),
    glob = require('glob'),
    pug = require('gulp-pug'),
    sass = require('gulp-sass'),
    log = require('fancy-log'),
    babel = require('gulp-babel'),
    color = require('ansi-colors'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    merge = require('merge-stream'),
    cleanCss = require('clean-css'),
    penthouse = require('penthouse'),
    htmlmin = require('gulp-htmlmin'),
    replace = require('gulp-replace'),
    staticServer = require('node-static'),
    responsive = require('gulp-responsive'),
    gulpCleanCss = require('gulp-clean-css'),
    replaceTask = require('gulp-replace-task'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create();

var paths = {
    templates__test: 'app/views/**/*.pug',
    templates_pages__test: 'app/views/pages/*.pug',
    templates_html__test: 'dist/**/*.html',
    templates_html__dist: 'dist',
    images__test: 'app/img/**/*',
    images_opt__test: 'app/img/opt/**/*.{jpg,png}',
    images_opt__dist: 'dist/img',
    images_raw__test: 'app/img/raw/**/*.{bmp,ico,jpg,png,svg,gif}',
    images_raw__dist: 'dist/img',
    css__test: 'app/css/**/*.css',
    css__dist: 'dist/css',
    sass: 'app/scss',
    sass__test: 'app/scss/**/*.scss',
    sass__dist: '.tmp/css',
    fonts__test: 'app/fonts/**/*',
    fonts__dist: 'dist/fonts',
    js_app__test: 'app/js/app/*.js',
    js_app__dist: 'dist/js',
    js_app__dist_filename: 'app.js',
    js_sw__test: 'app/js/sw_offline.js',
    js_sw__dist: 'dist',
    js_sw__dist_filename: 'sw_offline.js',
    other_root__test: 'app/*',
    other_root__dist: 'dist',
    all_test: 'dist/**/*',
    all_dist: 'dist'
};

var getPackageJson = () => {
    return JSON.parse(fs.readFileSync('package.json', 'utf8'));
};

gulp.task('js__app', () => {
    return gulp.src(paths.js_app__test)
        .pipe(babel({
            presets: [ '@babel/env' ],
        }))
        .pipe(uglify({
            warnings: false,
            parse: {
                html5_comments: false,
            },
            compress: {
                sequences: 200,
                unused: true,
                properties: true,
                drop_debugger: true,
                conditionals: true,
                comparisons: true,
                evaluate: true,
                booleans: true,
                loops: true,
                toplevel: true,
                hoist_funs: true,
                hoist_vars: true,
                if_return: true,
                join_vars: true,
                collapse_vars: true,
                reduce_vars: true,
                negate_iife: true,
                passes: 10,
            },
            output:  {
                beautify: false,
                webkit: true,
                wrap_iife: true,
            },
            ie8: false,
        }))
        .pipe(concat(paths.js_app__dist_filename))
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.js_app__dist))
        .pipe(browserSync.stream());
});

gulp.task('js', gulp.parallel('js__app'));

gulp.task('images__raw', () => {
    return gulp.src(paths.images_raw__test)
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.images_raw__dist))
        .pipe(browserSync.stream());
});

gulp.task('images__opt', () => {
    return gulp.src(paths.images_opt__test)
        .pipe(responsive(
            {
                '**/*': [{
                    width: 1024
                }]
            }, {
                quality: 80,
                compressionLevel: 9,
                progressive: true,
                withMetadata: false,
                errorOnEnlargement: false,
            }))
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.images_opt__dist))
        .pipe(browserSync.stream());
});

gulp.task('images', gulp.parallel('images__raw', 'images__opt'));

gulp.task('fonts__copy', () => {
    return gulp.src(paths.fonts__test)
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.fonts__dist))
        .pipe(browserSync.stream());
});

gulp.task('css__compile', () => {
    var sassStream,
        cssStream;

    sassStream = gulp.src(paths.sass__test)
        .pipe(sass())
        .on('error', function($err) { log(color.red($err.message)); });

    cssStream = gulp.src(paths.css__test)
        .on('error', function($err) { log(color.red($err.message)); });

    return merge(cssStream, sassStream)
        .pipe(autoprefixer({
            cascade: true,
        }))
        .pipe(concat('app.css'))
        .pipe(replace('@charset "UTF-8";', ''))
        .pipe(replaceTask({
            patterns: [
                {
                    match: 'version',
                    replacement: getPackageJson().version,
                }
            ]
        }))
        .pipe(gulpCleanCss({
            compatibility: 'ie9',
            advanced: true,
            roundingPrecision: 3,
        }))
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.css__dist))
        .pipe(browserSync.stream());
});

gulp.task('templates__compile', () => {
    return gulp.src(paths.templates_pages__test)
        .pipe(pug())
        .pipe(htmlmin({
            minifyURLs: true,
            sortAttributes: true,
            sortClassName: true,
            useShortDoctype: true,
            removeAttributeQuotes: true,
            quoteCharacter: '\"',
            minifyJS: true,
        }))
        .pipe(replaceTask({
            patterns: [
                {
                    match: 'version',
                    replacement: getPackageJson().version,
                }
            ]
        }))
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.templates_html__dist))
        .pipe(browserSync.stream());
});

gulp.task('other_root__copy', () => {
    gulp.src(paths.other_root__test)
        .pipe(replaceTask({
            patterns: [
                {
                    match: 'version',
                    replacement: getPackageJson().version,
                },
                {
                    match: 'timestamp',
                    replacement: new Date().getTime(),
                }
            ]
        }))
        .on('error', function($err) { log(color.red($err.message)); })
        .pipe(gulp.dest(paths.other_root__dist))
        .pipe(browserSync.stream());
});

gulp.task('other', gulp.parallel('other_root__copy'));

gulp.task('compile', gulp.parallel('js', 'images', 'fonts__copy', 'other', 'templates__compile', 'css__compile'));

gulp.task('compile-optimized', gulp.parallel('compile', () => {
    var file = new staticServer.Server('dist', {
        cache: 3600,
    });

    var serve = http.createServer(function (req, res) {
        req.addListener('end', function () {
            file.serve(req, res);
        }).resume();
    });
    serve.listen(3100);

    function criticalByDimensions($path, $dimensions, $i, $str, $callback) {
        var $width = parseInt($dimensions[$i][0]);
        var $height = parseInt($dimensions[$i][1]);
        var $url = 'http://localhost:3100/' + $path;

        log('Processing: ' + $path + ' [' + $width + 'x' + $height + '] on ' + $url);

        penthouse({
            url: $url,
            css: './dist/css/app.css',
            width: $width,
            height: $height,
            timeout: 90*1000,
            strict: false,
            maxEmbeddedBase64Length: 1000,
            userAgent: 'Penthouse Critical Path Css Generator',
            renderWaitTime: 10*1000,
            blockJSRequests: false,
        })
            .then(function($css) {
                $str += $css;
                if(++$i < $dimensions.length) criticalByDimensions($path, $dimensions, $i, $str, $callback);
                else $callback($str);
            })
            .catch(function($err) {
                log(color.red('Error during criticalize ' + $url));
            });
    }

    function doCriticalize($paths, $i, $callback) {
        var $path = $paths[$i];
        var $pathRelative = $path.replace('dist/', '');

        log('Optimize file', $pathRelative, '...');

        criticalByDimensions($pathRelative, [[1580, 1580/2], [1579, 1579/2], [1279, 1279/2], [979, 979/2], [735, 735/2], [479, 479/2]], 0, '', function($cssRaw) {
            fs.readFile($path, 'utf8', function ($err, $data) {
                if ($err) {
                    log(color.red('Optimize file', $pathRelative, 'failed on read sources'));
                    return console.log($err);
                }

                var $cssOptimized = new cleanCss({
                    compatibility: 'ie9',
                    level: {
                        2: {
                            roundingPrecision: 'all=3',
                        }
                    }
                })
                    .minify($cssRaw);

                log('Optimize file', $pathRelative, 'ok minify');

                var $styles = $cssOptimized.styles;
                $styles = $styles.replace(/\.\.\//g, '');

                var $result = $data.replace(/<!--@@css-critical-->/g, '<style>' + $styles + '</style>');

                fs.writeFile($path, $result, 'utf8', function ($err) {
                    if ($err) {
                        log(color.red('Optimize file', $pathRelative, 'failed on write file'));
                        return log(color.red($err.message));

                    } else {
                        log('Optimize file', $pathRelative, 'ok write file');
                    }

                    if(++$i < $paths.length) doCriticalize($paths, $i, $callback);
                    else $callback();
                });
            });
        });
    }

    glob(paths.templates_html__test, function ($err, $paths) {
        if ($err) {
            log(color.red('Optimize files failed on list files'));
            log(color.red($err.message));
            return console.log($err);
        }

        var $iStarted = 0;
        var $iEnded = 0;
        var $arrTmp = $paths;
        var $arrSize = $arrTmp.length /3;
        $arrSize = $arrSize < 1 ? 1 : parseInt($arrSize) +1;

        function callbackEnd() {
            $iEnded++;

            log('Node ' + $iEnded + '/' + $iStarted + ' ended');

            if($iEnded === $iStarted) {
                log('Compile done.');
                serve.close();
                log('Server closed.');
            }
        }

        while($arrTmp.length) {
            $iStarted++;
            log('Node ' + $iStarted + ' started');
            doCriticalize($arrTmp.splice(0, $arrSize), 0, callbackEnd);
        }
    });
}));

// Static server
gulp.task('serve', gulp.parallel('compile', () => {
    browserSync
        .init({
            server: {
                baseDir: 'dist',
            }
        });

    gulp.watch([paths.js_sw__test, paths.js_app__test], gulp.parallel('js'));
    gulp.watch(paths.images__test, gulp.parallel('images'));
    gulp.watch(paths.fonts__test, gulp.parallel('fonts__copy'));
    gulp.watch([paths.other_root__test], gulp.parallel('other'));
    gulp.watch(paths.templates__test, gulp.parallel('templates__compile'));
    gulp.watch([paths.css__test, paths.sass__test], gulp.parallel('css__compile'));
}));
