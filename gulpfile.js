
const gulp = require("gulp")
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");

gulp.task("build-js-dev",()=>{
	gulp.src("./src/js/*.js")
	.pipe(sourcemaps.init())
	.pipe(concat("dill.js"))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest("./src/dist"));
});

gulp.task("build-js-prod",()=>{
	gulp.src("./src/js/*.js")
	.pipe(concat("dill.min.js"))
	.pipe(uglify())
	.pipe(gulp.dest("./src/dist"));
});

gulp.task("watch-js",()=>{
	gulp.watch("./src/js/*.js",["build-js-dev"]);
});

gulp.task("default",["build-js-dev"]);
