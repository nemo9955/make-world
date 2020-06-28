module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
        library: 'make_world'
    },
    module: {
        rules: [
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
};
