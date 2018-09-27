let config = require('./ropsten/config')
if (process.env.DC_NETWORK === 'local') config = require('./local/config')

config = (typeof DCLIB_CONFIG === 'object')
  ? Object.assign(config, window.DCLIB_CONFIG)
  : config

module.exports = config
