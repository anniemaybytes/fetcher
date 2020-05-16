const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ManifestReplacePlugin = require('webpack-manifest-replace-plugin');

module.exports = {
  mode: 'none',
  entry: {
    bundle: ['./src/static/js/index.js'],
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist/static'),
    filename: '[name].[chunkhash].js',
    hashDigestLength: 10,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: false,
            },
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
    new ManifestReplacePlugin({
      include: './src/views',
      test: /\.pug$/,
      outputDir: path.resolve(__dirname, 'dist/views'),
    }),
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  optimization: {
    moduleIds: 'hashed',
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
};
