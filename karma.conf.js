// Karma configuration
// Generated on Sat Feb 24 2018 11:25:09 GMT+0200 (EET)
/* eslint-disable */

const webpack = require('webpack')

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/_bootstrap.js', included: true, served: true, watched: false },
      { pattern: 'src/index.js', included: true, served: true, watched: false },
      // { pattern: 'dist/DC.js', included: true, served: true, watched: false },
      { pattern: 'node_modules/fetch-mock/es5/client-bundle.js', included: true, served: true, watched: false },
      'test/*.spec.js'
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/index.js': ['webpack', 'sourcemap'],
    },

    webpack: {
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['stage-2'],
                plugins: [
                  ['transform-es2015-modules-commonjs', { allowTopLevelThis: true }],
                  ['istanbul']
                ]
              }
            }
          }
        ]
      },
      plugins:[
        new webpack.DefinePlugin({
            'process.env': {
                DC_NETWORK: '"'+process.env.DC_NETWORK+'"',
            },
        })
      ],

      resolve: {
        modules: ['../protocol/build/', 'src', 'node_modules', 'packages']
      },
      devtool: 'inline-source-map'
    },

    client: {
      mocha: {
          timeout: '20000'
      }
    },

    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage',
      subdir: '.'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DISABLE,
    // logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: process.env.TRAVIS ? ['ChromeHeadlessNoSandbox'] : ['ChromeHeadless'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    browserNoActivityTimeout: 100000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
