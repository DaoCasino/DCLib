/* global XMLHttpRequest */

let ERC20
const xhr = new XMLHttpRequest()
xhr.open('GET', 'http://127.0.0.1:8181/?get=contract&name=ERC20', false)
xhr.send()

if (xhr.status === 200) {
  ERC20 = JSON.parse(xhr.responseText)
}

module.exports = {
  upd : '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  rtc_room  : 'dc-room1',
  rtc_store : 'rtc_msgs',
  logname   : 'dclib',
  loglevel  : window.LOG_LEVEL || 'none',
  // loglevel  : 'hight',

  network: 'local',
  rpc_url: 'http://localhost:9545/',
  api_url: 'http://localhost:8181/',
  signal : '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star/',

  tx_confirmations:0,

  contracts: {
    erc20: {
      address: ERC20.address,
      abi: JSON.parse(ERC20.abi)
    }
  },

  gasPrice : 40 * 1000000000,
  gasLimit : 40 * 100000
}
