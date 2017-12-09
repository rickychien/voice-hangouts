const webpack = require('webpack');

const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  entry: {
    client: [
      './client/index.jsx',
      isDev && 'webpack-hot-middleware/client',
    ].filter((file) => file),
  },
  output: {
    path: `${__dirname}/public`,
    filename: 'bundle.js',
    publicPath: '/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(isDev ? 'development' : 'production'),
      },
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(gif|svg|png|ttf|eot|jpe?g|woff2?)$/,
        use: 'url-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[path][name]_[local]__[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },
  devtool: isDev && 'source-map',
};
