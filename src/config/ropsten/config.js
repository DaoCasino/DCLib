let erc20, paychannel

if (process.env.DC_NETWORK !== 'local') {
  erc20 = require('./contracts/erc20')
  paychannel = require('./contracts/paychannel')
}

module.exports = {
  upd: '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  rtc_room  : 'dc-room1',
  rtc_store : 'rtc_msgs',
  logname   : 'dclib',
  loglevel  : 'hight',

  network: 'ropsten',
  rpc_url: 'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',
  wss_url: 'wss://ropsten.infura.io/ws/',
  api_url: 'https://platform.dao.casino/faucet2',
  // signal : '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
  // signal  : '/ip4/46.101.244.101/tcp/9090/ws/p2p-websocket-star/',
  // signal  : '/ip4/146.185.173.84/tcp/9090/ws/p2p-websocket-star/',
  signal  : '/dns4/ws.dao.casino/tcp/443/wss/p2p-websocket-star/',

  tx_confirmations:2,

  contracts: {
    erc20: erc20,
    paychannel: paychannel
  },

  gasPrice : 100 * 1000000000,
  gasLimit : 40 * 100000
}
