
/* global XMLHttpRequest */
module.exports = {
  upd : '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  rtc_room  : 'dc-room1',
  rtc_store : 'rtc_msgs',
  logname   : 'dclib',
  // loglevel  : window.LOG_LEVEL || 'none',
  loglevel  : 'hight',

  network: 'local',
  rpc_url: 'http://localhost:9545/',
  api_url: 'http://localhost:8181/',
  // signal : '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star/',

  tx_confirmations:0,

  rollbar: {
    accessToken: '1561ff6cec5043c287122e7d15e7902b',
    captureUncaught: true,
    payload: {
      environment: 'production'
    }
  },

  gasPrice : 40 * 1000000000,
  gasLimit : 40 * 100000
}
