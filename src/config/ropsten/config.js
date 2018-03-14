let erc20, paychannel

if (process.env.DC_NETWORK !== 'local') {
  erc20 = require('./contracts/erc20')
  paychannel = require('./contracts/paychannel')
}

module.exports = {
  upd : '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  rtc_room  : 'dc-room1',
  rtc_store : 'rtc_msgs',
  logname   : 'dclib',
  loglevel  : 'hight',

  network: 'ropsten',
  rpc_url: 'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',
  api_url: 'https://platform.dao.casino/api/',

  contracts: {
    erc20: erc20,
    paychannel: paychannel
  },

  gasPrice : 40 * 1000000000,
  gasLimit : 40 * 100000
}
