const path = require("path");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();


module.exports = smp.wrap({
    entry: './src/index.ts',
    node: {
        fs: "empty", // https://stackoverflow.com/a/61046205/2948519
    },
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
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].js',
        library: 'make_world',
        publicPath: "/dist/",
        path: path.resolve(__dirname, "dist/"),
    },
    devServer: {
        // compress: true,
        disableHostCheck: true,   // That solved it
        headers: {
            "Cross-Origin-Embedder-Policy": " require-corp",
            "Cross-Origin-Opener-Policy": " same-origin",
        },
    },
});
