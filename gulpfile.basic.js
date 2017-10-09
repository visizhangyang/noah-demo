var gulp = require('gulp');
var browserSync = require('browser-sync');


gulp.task('hello', function() {
  console.log('Hello World!');
});

gulp.task('browserSync', function() {


  browserSync({
    server: {
      baseDir: 'app',
	//proxy: "localhost:8000"
    },
  })


})
