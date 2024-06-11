import HtmlWebpackPlugin from 'html-webpack-plugin';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  devtool: process.env.NODE_ENV == 'production' ? false : 'eval-source-map', // or 'inline-source-map'
  entry: {
    app: './src/pages/meeting/meeting.ts',
    home: './src/pages/home/home.ts',
    new: './src/pages/new/new.ts'
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].build.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
        options: {
          // Don't fail the build because of type mismatches.
          // There is no need to output types anyway.
          transpileOnly: true,
        }
      },
      {
        test: /\.html$/,
        loader: 'vue-template-loader',
        exclude: [
          resolve(__dirname, 'src/pages/meeting/meeting.html'),
          resolve(__dirname, 'src/pages/home/home.html'),
          resolve(__dirname, 'src/pages/new/new.html')
        ],
        options: {
          scoped: true
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
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
    })
  ]
};
