const path = require('path');
const rimraf = require('rimraf');
const webpack = require('webpack');
const browserslist = require('browserslist');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
// const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');

let Visualizer;

const isProduction = process.env.NODE_ENV !== 'development'; // either production or server
const isServer = process.env.NODE_ENV === 'server';
const isDebug = process.env.DEBUG === 'true';
// const isHMR = !isProduction && !isServer;
const isHMR = !!process.argv.find(v => v.includes('webpack-dev-server'));

if (isDebug) {
  Visualizer = require('webpack-visualizer-plugin');
  process.traceDeprecation = true;
}


/**
 * build folder will be deleted on server build crash or cancel,
 * this is required to exit full-server mode
 * by simply turning off start:server process
 */
if (isServer) {
  const exitHandler = () => rimraf.sync('build');
  process.on('SIGINT', exitHandler); // catches ctrl+c event
  process.on('uncaughtException', exitHandler); // catches uncaught exceptions
}

module.exports = {
  entry: isServer ? {
    server: [
      'react-dom',

      /** server requires react-dom-server */
      path.resolve(__dirname, './src/utils/react-dom-server'),

      /** for server we just use all polyfills */
      'babel-polyfill',

      /** application code should come last */
      path.resolve(__dirname, './src/pages'),
      path.resolve(__dirname, './src'),
    ],
  } : {
    bundle: [
      'react-dom',

      /** client polyfills */
      'core-js/es6/set',
      'core-js/fn/object/keys',
      'core-js/fn/object/values',
      'core-js/fn/promise',
      'core-js/fn/array/from',
      'core-js/fn/array/of',
      'core-js/fn/array/find',
      'core-js/fn/array/find-index',
      'core-js/fn/array/fill',
      'core-js/fn/array/filter',
      'core-js/fn/array/for-each',
      'core-js/fn/array/includes',
      'core-js/fn/string/starts-with',
      'core-js/fn/string/ends-with',
      'core-js/fn/object/assign',
      'whatwg-fetch',

      /** application code should come last */
      path.resolve(__dirname, './src/pages'),
      path.resolve(__dirname, './src'),
    ],
    raven: path.resolve(__dirname, './src/utils/raven/index.cjs'),
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
        test: require.resolve('./src/pages'),
        use: [
          { loader: 'expose-loader', options: 'beeline.pages' },
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
        test: require.resolve('./src'),
        use: [
          { loader: 'expose-loader', options: 'beeline.components' },
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
          /node_modules[/\\]beeline-layout-components/,
          /node_modules[/\\]beeline-react-ui-toolkit/,
          /node_modules[/\\]beeline-store/,
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
        test: require.resolve('./src/utils/raven/index.cjs'),
        use: [
          { loader: 'expose-loader', options: 'Raven' },
        ],
      },
      ...isServer ? [{
        test: require.resolve('./src/utils/react-dom-server'),
        use: [
          { loader: 'expose-loader', options: 'ReactDOMServer' },
        ],
      }] : [],

      {
        test: /\.p?css$/,
        use: ExtractTextPlugin.extract({
          ...isHMR ? {
            fallback: 'style-loader',
          } : {},

          use: [
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
        }),
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
    ...(!isProduction && isServer ? [
      new WriteFilePlugin(),
    ] : []),
    // new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin({
      filename: '[name].css',
      disable: isHMR, // do not extract css in development
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isProduction && !isDebug ? "'production'" : "'development'",
        SUPPORTED_BROWSERS: `'|${browserslist(['> 0.5%', 'last 2 versions', 'not dead']).join('|')}|'`,
      },
    }),
    ...(isDebug ? [
      new Visualizer({
        filename: `./stats.${process.env.NODE_ENV}.htm`,
      }),
    ] : []),

  ],

  devtool: isProduction || isServer ? 'source-map' : false,
  stats: {
    colors: true,
    chunks: false,
    children: false,
  },
  /**
   * remove console in server rendering
   * by default
   */
  ...isServer ? {
    optimization: {
      minimizer: [
        new UglifyJSPlugin({
          uglifyOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      ],
    },
  } : {},
  devServer: {
    hot: true,
    port: 8081,
    overlay: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    // proxy: [{
    //   context: ['**', '!/build', '!/__webpack_hmr'],
    //   target: 'http://localhost:3000',
    //   secure: false,
    //   // rewrite: function(req, options) {
    //   //   //you can handle rewrite here if you need to
    //   // }
    // }],
    // before(app) {
    //   app.use(errorOverlayMiddleware());
    // },
    stats: {
      children: false,
      colors: true,
      chunks: false,
      // timings: true,
      // chunkModules: false,
      // modules: false,
      // reasons: false,
    },
  },
};
