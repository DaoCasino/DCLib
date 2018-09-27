let erc20, paychannel

if (process.env.DC_NETWORK !== 'local') {
  erc20 = require('./contracts/erc20')
  paychannel = require('./contracts/paychannel')
}

let api_url = 'https://stage.dao.casino/faucet'
if (process.env.NODE_ENV === 'production') {
  api_url = 'https://faucet.dao.casino'
}

module.exports = {
  upd: '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  dappRoom  : process.env.DAPP_ROOM  || 'dapp_room_',

  logname   : 'dclib',
  loglevel  : 'hight',

  network: 'ropsten',
  rpc_url: 'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',
  // wss_url: 'wss://ropsten.infura.io/ws/',

  api_url: api_url,

  // signal  : [
  //   '/dns4/signal2.dao.casino/tcp/443/wss/p2p-websocket-star/',
  //   '/dns4/signal3.dao.casino/tcp/443/wss/p2p-websocket-star/',
  // ],

  tx_confirmations:2,

  contracts: {
    erc20: erc20,
    paychannel: paychannel
  },

  gasPrice : 100 * 1000000000,
  gasLimit : 40 * 100000
}
