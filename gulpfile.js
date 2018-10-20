var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var insertLines = require('gulp-insert-lines');

gulp.task('insert-styles-bundle', function () {
	gulp.src('source/index.html')
	.pipe(insertLines({
		'before': /<\/head>$/,
		'lineBefore': '    <script src="//console.re/connector.js" data-channel="power-ui-tests" id="consolerescript"></script>'
	}))
	.pipe(insertLines({
		'before': /<\/head>$/,
		'lineBefore': '    <script src="debug/show_errors.js"></script>'
	}))
	.pipe(gulp.dest('.'));
});

gulp.task('build', function () {
	gulp.src('source/index.html')
	.pipe(gulp.dest('.'));
});

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./",
            routes: {
                "/": "index.html",
                // "/console": "index.html", // log errors to browser console
                // "/vconsole": "index.html", // log errors to virtual console
                // "/alert": "index.html", // log errors as alerts
            },
        },
        startPath: '/',
    });
});

gulp.task('default', ['build', 'browser-sync']);
gulp.task('debug', ['insert-styles-bundle', 'browser-sync']);
