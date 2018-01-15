const path = require('path')
const webpack = require('webpack')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackCdnPlugin = require('webpack-cdn-plugin')

const isDev = process.env.NODE_ENV !== 'production'

module.exports = {
  entry: {
    client: [
      './client/index.jsx',
      isDev && 'webpack-hot-middleware/client'
    ].filter((file) => file)
  },
  output: {
    path: `${__dirname}/public`,
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    isDev && new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(isDev ? 'development' : 'production')
      }
    }),
    !isDev && new UglifyJSPlugin({
      uglifyOptions: {
        beautify: false,
        ecma: 6,
        compress: true,
        comments: false
      }
    }),
    new HtmlWebpackPlugin({
      title: 'Voice Hangouts',
      template: './client/index.template.html'
    }),
    !isDev && new WebpackCdnPlugin({
      modules: [
        {
          name: 'react',
          var: 'React'
        },
        {
          name: 'react-dom',
          var: 'ReactDOM'
        }
      ],
      prod: true,
      prodUrl: 'https://unpkg.com/:name@:version/umd/:name.production.min.js'
    })
  ].filter((file) => file),
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        include: path.resolve(__dirname, 'client')
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
              localIdentName: '[path][name]_[local]__[hash:base64:5]'
            }
          }
        ],
        include: path.resolve(__dirname, 'client')
      }
    ]
  },
  devtool: isDev && 'source-map'
}
