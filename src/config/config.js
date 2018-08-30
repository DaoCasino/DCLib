let config
if (process.env.DC_NETWORK === 'local') {
  config = (typeof DCLIB_CONFIG === 'object')
    ? Object.assign(require('./local/config'), window.DCLIB_CONFIG || {})
    : require('./local/config')
}

if (!process.env.DC_NETWORK || process.env.DC_NETWORK === 'ropsten') {
  config = require('./ropsten/config')
}

module.exports = config
