const path = require("path");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();


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
    // optimization: {
    //     splitChunks: {
    //         chunks: 'all',
    //     },
    // },
    output: {
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].js',
        library: 'make_world',
        publicPath: "/dist/",
        path: path.resolve(__dirname, "dist/"),
        // library: {
        //   name: 'make_world',
        //   type: 'umd',
        // },
        // libraryTarget: 'umd',
        // umdNamedDefine: true,
        // globalObject: 'this'
    },
    devServer: {
        disableHostCheck: true,
        headers: {
            "Cross-Origin-Embedder-Policy": " require-corp",
            "Cross-Origin-Opener-Policy": " same-origin",
        },
    },
});
