let config

if (process.env.DC_NETWORK === 'local') {
  config = require('./local/config')
}

if (!process.env.DC_NETWORK || process.env.DC_NETWORK === 'ropsten') {
  config = require('./ropsten/config')
}

module.exports = config
