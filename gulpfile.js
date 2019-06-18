
const gulp = require("gulp");
const rollup = require("rollup");
const minify = require("gulp-minify");

gulp.task("build:js",()=>{
	return rollup.rollup({
		input: "./src/main.js"
	}).then(bundle=>{
		return bundle.write({
			file: "./dist/dill.js",
			format: "iife",
			sourcemap: true
		});
	});
});

gulp.task("watch:js",()=>{
	gulp.watch("./src/**/*.js", gulp.series("build:js"));
});

gulp.task("build:js:prod",()=>{
	return gulp.series("build:js", "minify");
});

gulp.task("minify", ()=>{
	return gulp.src(["./dist/dill.js"])
		.pipe(minify({
			ext: {
				min: ".min.js"
			}
		}))
		.pipe(gulp.dest("dist"));
});

gulp.task("default", gulp.series("build:js"));
