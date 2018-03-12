
module.exports = {
  upd : '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  rtc_room  : 'dc-room1',
  rtc_store : 'rtc_msgs',
  loglevel  : 'none',

  network   : 'ropsten',
  rpc_url   : 'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',

  contracts: {
    erc20      : require('./contracts/erc20.js'),
    paychannel : require('./contracts/paychannel.js')
  },

  gasPrice : 40 * 1000000000,
  gasLimit : 40 * 100000,

  api_url : 'https://platform.dao.casino/api/'
}
