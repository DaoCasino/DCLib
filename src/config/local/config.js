module.exports = {
  upd : '17.10.2017',

  wallet_pass : '1234',

  db_name   : 'DCLib',
  rtc_room  : 'dc-room1',
  rtc_store : 'rtc_msgs',
  logname   : 'dclib',
  loglevel  : 'hight',

  network: 'local',
  rpc_url: 'http://localhost:9545/',
  api_url: 'https://platform.dao.casino/api/',

  privateKeys: [
    'bd09810322a16c92882feb58405f269917a52d3f97c5e66bd0069b2e1ab026a4',
    '1f8aeb4c906da2ff0b39f97da1f4ec2dde4fdbcf19b564e548d9b22337c410a2',
    'd5c28e9cf4cd8b0f679beb3e70cf6fa2b6b97516b0473899bc10a007366a8c3e',
    '8d621658264828cb03de09c7dfb8de47bd69de61b913fd83f41bf62bf7664e4b',
    'ebb3bfb0d61c8a29d735a63b3ff9fa4cf257467ef4ee7f90f500e0e9dd9b6d24',
    '353cbbcbe97d1f9769d875d14cae24ac1e203f5b628e32de5f7a6b0b110bd289',
    '549a12c3dd717368463fdc2066400d30d776505e264f2fe012fc3366f05bbacb',
    '96ddb3a6b27ade150e4ce82432e9a314aa9b0374b82d61c809ef09be863ed657',
    '5cb13d8a7b0a7060a5af001ea3501e461148db5c8e89346a4a5643f842df6be1',
    '167075d7100cddcb09d4e6078cf88c3c30fd23e6120be3296ffaf245ec5be1bf'
  ],

  contracts: {
    erc20: {
      address: require('contracts.json').ERC20,
      abi: require('contracts/ERC20.json').abi
    },
    paychannel: {
      address: require('../ropsten/contracts/paychannel').address,
      abi: require('../ropsten/contracts/paychannel').abi
    }
  },

  gasPrice : 40 * 1000000000,
  gasLimit : 40 * 100000
}
