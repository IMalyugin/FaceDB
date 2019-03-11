const path = require('path');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV !== 'development'; // either production or server
const isDebug = process.env.DEBUG === 'true';
// const isHMR = !isProduction && !isServer;
const isHMR = !!process.argv.find(v => v.includes('webpack-dev-server'));

module.exports = {
  entry: {
    bundle: [
      'react-dom',
      /** application code should come last */
      path.resolve(__dirname, './src'),
    ],
  },

  output: {
    filename: '[name].js',
    publicPath: '/build/',
    path: path.resolve(__dirname, './build'),
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    modules: ['node_modules', 'src'],
    symlinks: false,
  },

  module: {
    rules: [
      {
        test: require.resolve('./src'),
        use: [
          { loader: 'expose-loader', options: 'components' },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              plugins: isHMR ? ['react-hot-loader/babel'] : [],
            },
          },
        ],
      },
      {
        test: /\.jsx?$/,
        use: [{
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: isHMR ? ['react-hot-loader/babel'] : [],
          },
        }],
        include: [
          path.resolve(__dirname, './src'),
          /node_modules[/\\]beeline-react-ui-toolkit/,
        ],
      },
      {
        test: require.resolve('react'),
        use: [
          { loader: 'expose-loader', options: 'React' },
        ],
      },
      {
        test: require.resolve('react-dom'),
        use: [
          { loader: 'expose-loader', options: 'ReactDOM' },
        ],
      },
      {
        test: /\.p?css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true,
              localIdentName: '[folder]_[local]_[hash:base64:4]',
            },
          },
          { loader: 'postcss-loader' },
        ],
      },
      {
        test: /\.(woff|woff2|ttf|png|jpg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 4096,
              name: 'assets/[hash:base64:10].[ext]',
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [{ loader: 'svg-react-loader' }],
      },
    ],
  },

  plugins: [
    ...(isHMR ? [
      new webpack.HotModuleReplacementPlugin({ multiStep: true }),
      new webpack.NamedModulesPlugin(),
    ] : []),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isProduction && !isDebug ? "'production'" : "'development'",
      },
    }),
  ],

  devtool: isProduction ? 'source-map' : false,
  stats: {
    colors: true,
    chunks: false,
    children: false,
  },
  devServer: {
    hot: true,
    port: 8081,
    overlay: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: {
      children: false,
      colors: true,
      chunks: false,
    },
  },
};
