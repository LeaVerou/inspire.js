const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const postcss = require('gulp-postcss')
const sourcemaps = require('gulp-sourcemaps')
const cssnext = require('postcss-cssnext')

gulp.task('css', function () {
  const processors = [cssnext()]
  return gulp.src('./src/css/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./'))
    .pipe(browserSync.reload({stream: true}))
})

gulp.task('browser-sync', () => {
  browserSync.init({
    server: './',
    browser: 'firefox'
  })
})

gulp.task('watch', ['css'], () => {
  gulp.watch('**/*.html', browserSync.reload)
  gulp.watch('**/*.css', ['css'])
})

gulp.task('default', ['watch', 'browser-sync'])
