var gulp = require('gulp');
var browserSync = require('browser-sync');

var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');


gulp.task('hello', function() {
  console.log('Hello World!');
});

gulp.task('browserSync', function() {
  /*browserSync({
    server: {
      baseDir: 'app'
    },
  })*/

  browserSync({
    server: {
      baseDir: 'app',
      //proxy: "localhost:8000"
	middleware: [proxy(['/api'], {target: 'http://gw-master.kingifa.com/', changeOrigin: true}),
    proxy(['/upload'], {target: 'http://localhost:8080', changeOrigin: true})]
    }
  })


})



gulp.task('serverName', function() {
    connect.server({
        root: ['api'],
        port: 3001,
        livereload: true,
        middleware: function(connect, opt) {
            return [
                proxy('/api/',  {
                    target: 'http://localhost:8000/api/',
                    changeOrigin:true
                })
            ]
        }

    });
});

gulp.task('default',['browserSync'], function() {  
    // 将你的默认的任务代码放在这  
    console.log("default");  
});  