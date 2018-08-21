/* global DCLIB_CONFIG */

let config

if (process.env.DC_NETWORK === 'local') {
  config = (typeof DCLIB_CONFIG !== 'object')
    ? require('./local/config')
    : Object.assign(require('./local/config'), DCLIB_CONFIG)
}

if (!process.env.DC_NETWORK || process.env.DC_NETWORK === 'ropsten') {
  config = require('./ropsten/config')
}

module.exports = config
