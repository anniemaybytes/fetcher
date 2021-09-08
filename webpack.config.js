const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const hashDigestLength = 10;

// noinspection JSUnresolvedVariable,JSValidateTypes
module.exports = {
  mode: 'production',
  context: path.resolve(__dirname, 'src'),
  watchOptions: {
    ignored: ['lib/**/*.ts', 'node_modules/**']
  },
  entry: {
    bundle: ['./static/js/index.js'],
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist/static'),
    filename: '[name].[chunkhash].js',
    hashDigestLength: hashDigestLength,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new WebpackManifestPlugin({
      publicPath: '',
      removeKeyHash: new RegExp(`(\\.[a-f0-9]{${hashDigestLength}})(\\..*)`),
    }),
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new CopyPlugin({
      patterns: [{ from: 'views/', to: `../views/` }],
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
};
