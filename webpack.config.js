//webpack.config.js
const path = require("path");

module.exports = {
    mode: "production",
    devtool: "source-map",
    entry: {
        main: "./gehntris.ts",
    },
    output: {
        path: path.resolve(__dirname, "./"),
        filename: "gehntris.js",
        libraryTarget: "var",
        library: "Gehntris"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
};