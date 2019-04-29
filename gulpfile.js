var gulp = require('gulp'),
		concat = require('gulp-concat'),
		notify = require('gulp-notify'),
		uglify = require('gulp-uglify'),
    merge = require('merge-stream'),
		sass = require('gulp-sass');


var config = {
		sassPath: './assets/sass',
		modulesPath: './node_modules' ,
		staticPath: './static',
    vendorsPath: './vendor'
}


gulp.task('icons', function() { 
		return gulp.src(config.modulesPath + '/font-awesome/fonts/**.*') 
				.pipe(gulp.dest(config.staticPath + '/fonts')); 
});
/*
gulp.task('images', function() { 
    return gulp.src(config.modulesPath + '/leaflet/dist/images/**.*') 
        .pipe(gulp.dest(config.staticPath + '/images')); 
});
*/

gulp.task('css', function() { 
		//return gulp.src([config.modulesPath + '/uikit/dist/css/uikit.min.css', config.modulesPath + '/font-awesome/scss/*.scss', config.sassPath + '/style.scss'])
		
    cssStream = gulp.src([
      config.modulesPath + '/font-awesome/css/font-awesome.min.css',
      config.modulesPath + '/uikit/dist/css/uikit.min.css']);

    sassStream = gulp.src(config.sassPath + '/style.scss')
      .pipe(sass({outputStyle: 'compressed'}));

    return merge(cssStream, sassStream)
        .pipe(concat('style.css'))
        .pipe(gulp.dest(config.staticPath + '/css')); 
});


gulp.task('scripts', function() {
  return gulp.src([
      //config.modulesPath + '/fuse.js/dist/fuse.min.js',
      config.modulesPath + '/jquery/dist/jquery.min.js',
      config.modulesPath + '/uikit/dist/js/uikit.min.js',
      config.modulesPath + '/uikit/dist/js/uikit-icons.min.js',
      config.modulesPath + '/d3/build/d3.min.js',
      config.modulesPath + '/moment/min/moment.min.js',
      config.modulesPath + '/leaflet/dist/leaflet.js',
      /*config.modulesPath + '/d3-interpolate-path/build/d3-interpolate-path.min.js',
      config.modulesPath + '/d3-line-chunked/build/d3-line-chunked.min.js',
      config.modulesPath + '/d3-tip/index.js',
      config.modulesPath + '/bootstrap-daterangepicker/moment.min.js',
      config.vendorsPath + '/daterangepicker_custom.js',
      config.vendorsPath + '/concavehull.min.js',
      config.vendorsPath + '/jsclipper.js',
      config.vendorsPath + '/leaflet.freedraw.js'*/
  	])
    .pipe(concat('libs.js'))
    .pipe(uglify())
    .pipe(gulp.dest(config.staticPath + '/js'))
});

 
gulp.task('watch', function () {
	gulp.watch(config.sassPath + '/*.scss', ['css']);
});

gulp.task('default', ['css', 'scripts', 'icons']);