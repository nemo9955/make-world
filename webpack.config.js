const path = require("path");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

const ASSET_PATH = process.env.ASSET_PATH || '/dist/';

module.exports = smp.wrap({
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
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].js',
        // publicPath: "/dist/",
        // publicPath: "../dist/",
        // publicPath: path.resolve(__dirname, "dist/"),
        publicPath: ASSET_PATH,
        path: path.join(__dirname, "dist"),
        // path: "./dist/",
        // publicPath: path.join(__dirname, "dist"),
        // path: path.join(__dirname, "dist"),
        library: 'make_world',
        // libraryTarget: 'umd',
        // library: {
        //   name: 'make_world',
        //   type: 'umd',
        // },
        // umdNamedDefine: true,
        // globalObject: 'this'
    },
    optimization: {
        minimize: false,
        // runtimeChunk: 'single',
        // splitChunks: {
        //     chunks: 'all',
        // },
    },
    devServer: {
        static: __dirname,
        hot: false,
        // hotOnly: true,
        // compress: true,
        // injectClient: false,
        // disableHostCheck: true,
        // headers: {
        //     "Cross-Origin-Embedder-Policy": " require-corp",
        //     "Cross-Origin-Opener-Policy": " same-origin",
        // },
    },
});
