var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var insertLines = require('gulp-insert-lines');
var concat = require('gulp-concat');

var doNotEditThisFile = '<!-- *** ATENTION!!! *** File generated using gulp - DO NOT EDIT THIS FILE - user the real file in "source/templates/index.html" -->'

function reloadTask(done) {
	browserSync.reload();
	done();
}

gulp.task('insert-styles-bundle', function (done) {
	gulp.src('source/templates/index.html')
	.pipe(insertLines({
		'before': /<\/head>$/,
		'lineBefore': '    <script src="//console.re/connector.js" data-channel="power-ui-tests" id="consolerescript"></script>'
	}))
	.pipe(insertLines({
		'before': /<\/head>$/,
		'lineBefore': '    <script src="debug/show_errors.js"></script>'
	}))
	.pipe(insertLines({
		'before': '<!-- Porwer UI demo -->$',
		'lineBefore': doNotEditThisFile
	}))
	.pipe(gulp.dest('app/'));
});

gulp.task('build', function (done) {
	gulp.src('source/templates/index.html')
	.pipe(insertLines({
		'before': '<!-- Porwer UI demo -->$',
		'lineBefore': doNotEditThisFile
	})).pipe(gulp.dest('app/'));
	gulp.src('source/scripts/*.js').pipe(concat('power_ui.js')).pipe(gulp.dest('app/scripts/'));
	gulp.src('source/css/*.css').pipe(concat('power_ui.css')).pipe(gulp.dest('app/css/'));

	reloadTask(done);
});

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./app",
            routes: {
                "/": "/app/index.html",
                // "css/": "/app/css/power_ui.css",
                // "scripts/": "/app/scripts/power_ui.js",
            },
        },
        startPath: '/',
    });

    // gulp.watch("source/scripts/*.js").on('change', browserSync.reload);
    // gulp.watch("source/css/*.css").on('change', browserSync.reload);
    // gulp.watch("source/templates/*.*").on('change', browserSync.reload);
    // Reload 'build' on files change
    gulp.watch("source/scripts/*.js", ['build']);
    gulp.watch("source/css/*.css", ['build']);
    gulp.watch("source/templates/*.*", ['build']);
});

gulp.task('default', ['build', 'browser-sync']);
gulp.task('debug', ['insert-styles-bundle', 'browser-sync']);
