var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var extractSass = new ExtractTextPlugin({
  filename: '[name].css',
  allChunks: true,
  ignoreOrder: true
});

module.exports = {
  entry: {
    app: './src/pages/meeting/meeting.ts',
    home: './src/pages/home/home.ts',
    new: './src/pages/new/new.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].build.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'vue-template-loader',
        exclude: [
          path.resolve(__dirname, 'src/pages/meeting/meeting.html'),
          path.resolve(__dirname, 'src/pages/home/home.html'),
          path.resolve(__dirname, 'src/pages/new/new.html')
        ],
        options: {
          scoped: true
        }
      },
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader'
            }
          ]
        })
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      'socket.io-client': 'socket.io-client/dist/socket.io.slim.js'
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: './meeting.html',
      chunks: ['common', 'app'],
      template: './src/pages/meeting/meeting.html'
    }),
    new HtmlWebpackPlugin({
      filename: './new.html',
      chunks: ['common', 'new'],
      template: './src/pages/new/new.html'
    }),
    new HtmlWebpackPlugin({
      filename: './home.html',
      chunks: ['common', 'home'],
      inject: 'head',
      template: './src/pages/home/home.html'
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common'
    }),
    extractSass
  ]
};
