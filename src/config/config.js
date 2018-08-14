let config

if (process.env.DC_NETWORK === 'local') {
  config = require('./local/config')
}

if (!process.env.DC_NETWORK || process.env.DC_NETWORK === 'ropsten') {
  config = require('./ropsten/config')
}

if (typeof DCLIB_CONFIG === 'object') {
  config = Object.assign(config, DCLIB_CONFIG)
}

module.exports = config
