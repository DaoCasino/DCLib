'use strict'

const autoprefixer            = require('autoprefixer')
const fs                      = require('fs')
const path                    = require('path')
const webpack                 = require('webpack')
const HtmlWebpackPlugin       = require('html-webpack-plugin')
const ExtractTextPlugin       = require('extract-text-webpack-plugin')
const ManifestPlugin          = require('webpack-manifest-plugin')
const BundleSizeAnalyzer      = require('webpack-bundle-size-analyzer').WebpackBundleSizeAnalyzerPlugin
const InterpolateHtmlPlugin   = require('react-dev-utils/InterpolateHtmlPlugin')
const eslintFormatter         = require('react-dev-utils/eslintFormatter')
const ModuleScopePlugin       = require('react-dev-utils/ModuleScopePlugin')

const paths                   = require('./paths')
const getClientEnvironment    = require('./env')

const rootdir = __dirname + '/../..'

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = paths.servedPath

// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = publicPath === './'

// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1)

// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl)
let htmlReplacements = env.raw

// Assert this just to be safe.
// Development builds are slow and not intended for production.
if (env.stringified['process.env'].NODE_ENV !== '"production"') {
  throw new Error('Production builds must have NODE_ENV=production.')
}

// Note: defined here because it will be used more than once.
const cssFilename = 'static/css/[name].[contenthash:8].css'

// ExtractTextPlugin expects the build output to be flat.
// (See https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/27)
// However, our output is structured with css, js and media folders.
// To have this structure working with relative paths, we have to use custom options.
const extractTextPluginOptions = shouldUseRelativeAssetPaths
  ? // Making sure that the publicPath goes back to to build folder.
  { publicPath: Array(cssFilename.split('/').length).join('../') }
  : {}

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
let webpack_prod_config = {
  // Don't attempt to continue if there are any errors.
  bail: true,

  // We generate sourcemaps in production. This is slow but gives good results.
  // You can exclude the *.map files from the build during deployment.
  devtool: 'eval',

  // In production, we only want to load the polyfills and the app code.
  entry: ['babel-polyfill', require.resolve('./polyfills'), paths.appIndexJs],
  output: {
    // The build folder.
    path: paths.appBuild,

    // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: '../dist/DC.js',
    chunkFilename: '../dist/DC.[chunkhash:8].chunk.js',

    // We inferred the "public path" (such as / or /my-project) from homepage.
    publicPath: publicPath,

    // Point sourcemap entries to original disk location
    devtoolModuleFilenameTemplate: info => path.relative(paths.appSrc, info.absoluteResourcePath)
  },

  resolve: {
    // This allows you to set a fallback for where Webpack should look for modules.
    // We placed these paths second because we want `node_modules` to "win"
    // if there are any conflicts. This matches Node resolution mechanism.
    // https://github.com/facebookincubator/create-react-app/issues/253
    modules: [rootdir + '/src', rootdir + '/../protocol/build', 'packages', 'node_modules', paths.appNodeModules].concat(
	  		// It is guaranteed to exist because we tweak it in `env.js`
	  		process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
    ),

    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include .tag as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    extensions: ['.js', '.json', '.tag'],
    alias: {
    },

    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(paths.appSrc)
    ]
  },

  module: {
    exprContextCritical:  false,
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      // We are waiting for https://github.com/facebookincubator/create-react-app/issues/2176.
      { parser: { requireEnsure: false } },

      // ** ADDING/UPDATING LOADERS **
      // The "file" loader handles all assets unless explicitly excluded.
      // The `exclude` list *must* be updated with every change to loader extensions.
      // When adding a new loader, you must add its `test`
      // as a new entry in the `exclude` list in the "file" loader.

      // "file" loader makes sure those assets end up in the `build` folder.
      // When you `import` an asset, you get its filename.
      {
        exclude: [
          /\.html$/,
          /\.js$/,
          /\.tag$/,
          /\.css$/,
          /\.less$/,
          /\.json$/,
          /\.svg$/,
          /\.bmp$/,
          /\.gif$/,
          /\.jpe?g$/,
          /\.png$/
        ],
        loader: require.resolve('file-loader'),
        options: {
          name: 'static/media/[name].[hash:8].[ext]'
        }
      },

      // SVG loader
      // https://github.com/webpack-contrib/svg-inline-loader
      // load svg as plain/html
      // example usage:
      //  import myiconhtml from '../icons/myicon.svg'
      //  this.root.innerHTML = require('../../icons/' + this.opts.src)
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      },

      // "url" loader works just like "file" loader but it also embeds
      // assets smaller than specified size as data URLs to avoid requests.
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
          name: 'static/media/[name].[hash:8].[ext]'
        }
      },

      // Process JS with Babel.
      {
        test:    /\.js$/,
        include: paths.appSrc,
        loader:  require.resolve('babel-loader'),
        options: { presets: [['env', {
					      'targets': {
					        'browsers': ['last 2 versions', 'safari >= 7']
					      }
					    }]
    				] }
      },

      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(Object.assign({
          fallback: require.resolve('style-loader'),
          use: [
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 1,
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: require.resolve('postcss-loader'),
              options: {
                ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
                plugins: () => [
                  require('postcss-flexbugs-fixes'),
                  autoprefixer({
                    browsers: [
                      '>1%',
                      'last 4 versions',
                      'Firefox ESR',
                      'not ie < 9' // React doesn't support IE8 anyway
                    ],
                    flexbox: 'no-2009'
                  })
                ]
              }
            }
          ]
        }, extractTextPluginOptions)
        )

        // Note: this won't work without `new ExtractTextPlugin()` in `plugins`.

      }

      // ** STOP ** Are you adding a new loader?
      // Remember to add the new extension(s) to the "file" loader exclusion list.

    ]
  },

  plugins: [
	 	new BundleSizeAnalyzer(rootdir + '/size-report.txt'),

    // Makes some environment variables available in index.html.
    // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // In production, it will be an empty string unless you specify "homepage"
    // in `package.json`, in which case it will be the pathname of that URL.
    new InterpolateHtmlPlugin(htmlReplacements),

    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject:   true,
      template: paths.appHtml,
      minify: {
        removeComments:                true,
        collapseWhitespace:            true,
        removeRedundantAttributes:     true,
        useShortDoctype:               true,
        removeEmptyAttributes:         true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash:              true,
        minifyJS:                      true,
        minifyCSS:                     true,
        minifyURLs:                    true
      }
    }),

    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
    // It is absolutely essential that NODE_ENV was set to production here.
    // Otherwise React will be compiled in the very slow development mode.
    new webpack.DefinePlugin(env.stringified),

    // Minify the code.
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        // Disabled because of an issue with Uglify breaking seemingly valid code:
        // https://github.com/facebookincubator/create-react-app/issues/2376
        // Pending further investigation:
        // https://github.com/mishoo/UglifyJS2/issues/2011
        comparisons: false
      },
      output: {
        comments: false
      },
      sourceMap: false,
      mangle: false
    }),

    // Note: this won't work without ExtractTextPlugin.extract(..) in `loaders`.
    new ExtractTextPlugin({
      filename: cssFilename
    }),

    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    new ManifestPlugin({
      fileName: 'asset-manifest.json'
    }),

    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ],

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs:  'empty',
    net: 'empty',
    tls: 'empty'
  }
}

// LESS loader
if (process.env.enable_less) {
  webpack_prod_config.module.rules.push({
    test: /\.less$/,
    use: [
      // creates style nodes from JS strings
      { loader: 'style-loader' },
      // translates CSS into CommonJS
      { loader: 'css-loader'   },
      // compiles Less to CSS
      { loader: 'less-loader'  }
    ]
  })
}

module.exports = webpack_prod_config
