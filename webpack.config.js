const path = require("path");

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.worker\.js$/,
                use: { loader: "worker-loader" },
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: 'index.js',
        library: 'make_world',
        publicPath: "/dist/",
        path: path.resolve(__dirname, "dist/"),
    },
    // output: {
    //     // This is required so workers are known where to be loaded from
    //     publicPath: "/dist/",
    //     filename: "bundle.js",
    //     path: path.resolve(__dirname, "dist/"),
    // },
};
