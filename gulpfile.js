var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var insertLines = require('gulp-insert-lines');
var concat = require('gulp-concat');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify-es').default;

var doNotEditThisFile = '<!-- *** ATENTION!!! *** File generated using gulp - DO NOT EDIT THIS FILE - use the source file in "source/templates/index.html" -->'

function reloadTask(done) {
	browserSync.reload();
	done();
}

gulp.task('insert-styles-bundle', function (done) {
	gulp.src('source/templates/*.html')
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

const distJsFiles = [
	'source/scripts/power_core/core/power_core.js', // Order who goes first
	'source/scripts/pow_attrs/*.js',
	'source/scripts/power_core/core/power_ui.js',
	'source/scripts/power_core/*.js',
	'source/scripts/parser/*.js',
	'source/scripts/interface/*.js',
];
const devJsFiles = distJsFiles.concat(['source/scripts/temp_develop.js']);

const distCssFiles = [
	'source/css/core/*.css',
	'source/css/designs/*.css',
];
const devCssFiles = distCssFiles.concat(['source/css/temp_for_dev.css']);

gulp.task('develop', function (done) {
	gulp.src('source/templates/index.html')
	.pipe(insertLines({
		'before': '<!-- Porwer UI demo -->$',
		'lineBefore': doNotEditThisFile
	})).pipe(gulp.dest('app/'));
	gulp.src(devJsFiles).pipe(concat('power_ui.js')).pipe(gulp.dest('app/scripts/'));
	gulp.src(devCssFiles).pipe(concat('power_ui.css')).pipe(gulp.dest('app/css/'));
	gulp.src('source/templates/*.html').pipe(gulp.dest('app/'));

	reloadTask(done);
});

// Create the distribution files
gulp.task('dist', function (done) {
	gulp.src(distJsFiles).pipe(concat('power_ui.js')).pipe(gulp.dest('dist/'));
	gulp.src(distCssFiles).pipe(concat('power_ui.css')).pipe(gulp.dest('dist/'));
	done();
});

gulp.task('minify', function () {
	return gulp.src('dist/power_ui.js')
		.pipe(rename('power_ui.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/'));
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
	// Reload 'develop' on files change
	gulp.watch("source/scripts/**/*.js", ['develop']);
	gulp.watch("source/css/**/*.css", ['develop']);
	gulp.watch("source/templates/**/*.*", ['develop']);
});

gulp.task('default', ['develop', 'browser-sync']);
gulp.task('debug', ['insert-styles-bundle', 'browser-sync']);
