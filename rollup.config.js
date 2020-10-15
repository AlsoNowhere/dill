
import resolve from "@rollup/plugin-node-resolve";

export default {
    input: "./src/main.js",
    output: {
        file: "./dist/dill.js",
        format: "esm"
    },
    plugins: [
        resolve()
    ],
    watch: {
        exclude: "node_modules/**"
    }
};
