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
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].js',
        library: 'make_world',
        publicPath: "/dist/",
        path: path.resolve(__dirname, "dist/"),
    },
};
