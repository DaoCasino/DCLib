const paychannel = require('protocol/dapp.contract.json')
const ERC20 = {
  address: require('protocol/addresses.json').ERC20,
  abi: require('protocol/contracts/ERC20.json').abi
}

module.exports = {
  upd: '17.10.2017',

  wallet_pass: '1234',

  db_name:   'DCLib',
  dappRoom  : process.env.DAPP_ROOM  || 'dapp_room_',
  logname:   'dclib',
  loglevel:  'hight',

  network: 'local',
  rpc_url: 'http://localhost:1406/',
  api_url: 'http://localhost:8181/',

  // signal  : [
  //   '/dns4/signal2.dao.casino/tcp/443/wss/p2p-websocket-star/',
  //   '/dns4/signal3.dao.casino/tcp/443/wss/p2p-websocket-star/',
  // ],
  
  tx_confirmations: 0,

  contracts: {
    paychannel: paychannel,
    erc20: ERC20
  },

  gasPrice: 40 * 1000000000,
  gasLimit: 40 * 100000
}
