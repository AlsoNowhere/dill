
// import { uglify } from "rollup-plugin-uglify";
import progress from "rollup-plugin-progress";

const production = !process.env.ROLLUP_WATCH;

const devOutput = {
    // file: "./dist/dill.js",
    format: "cjs",
    sourcemap: true
};

// production && (devOutput.globals = {});
// production && (devOutput.globals["../common/logger.service"] = "logger");

devOutput.file = production ? "./dist/dill.min.js" : "./dist/dill.js";
// production && (devOutput.file = "./dist/dill.min.js")

export default {
    input: [production ? "./src/goose/main.js" : "./src/main.js"],
    output: devOutput,
    plugins: [
        progress(),
        // production && uglify()
    ],
    watch: {
// According to the latest: https://github.com/rollup/rollup/issues/1828, the following line will not work, i.e the file will not be watched.
// Manually restart the process when you update the afs-services
        // include: "../afs-services/index.js",
        exclude: "node_modules/**"
    }
};
