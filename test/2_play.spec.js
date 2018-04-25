/* eslint-env mocha */
/* global DCLib fetch sinon  fetchMock */

window.LOG_LEVEL = 'none'

let MyDApp

const dapp_slug    = 'dicetest_v32'
const dapp_deposit = 2
// const user_num     = 30000
// const user_bet     = 1

const initDCLibAndDApp = function (callback) {
  DCLib.defineDAppLogic(dapp_slug, function () {
    const _self = this

    const MAX_RAND_NUM = 65535
    const HOUSEEDGE    = 0.02 // 2%

    let history = []

    var Roll = function (user_bet, user_num, random_hash) {
      // convert 1BET to 100000000
      user_bet = DCLib.Utils.bet2dec(user_bet)

      // generate random number
      const random_num = DCLib.numFromHash(random_hash, 0, MAX_RAND_NUM)

      let profit = -user_bet
      // if user win
      if (user_num >= random_num) {
        profit = (user_bet * (MAX_RAND_NUM - MAX_RAND_NUM * HOUSEEDGE) / user_num) - user_bet
      }

      // add result to paychannel
      _self.payChannel.addTX(profit)
      _self.payChannel.printLog()

      // push all data to our log
      // just for debug
      const roll_item = {
        timestamp   : new Date().getTime(),
        user_bet    : user_bet,
        profit      : profit,
        user_num    : user_num,
        balance     : _self.payChannel.getBalance(),
        random_hash : random_hash,
        random_num  : random_num
      }
      history.push(roll_item)

      return roll_item
    }

    return {
      roll    : Roll,
      history : history
    }
  })

  DCLib.on('ready', async function () {
    await DCLib.Account.initAccount()

    function getGameContract (callback) {
      fetch('http://127.0.0.1:8181/?get=contract&name=Dice').then(function (res) {
        return res.json()
      }).then(function (localGameContract) {
        callback({
          address: localGameContract.address,
          abi: JSON.parse(localGameContract.abi)
        })
      })
    }

    getGameContract(function (gameContract) {
      MyDApp = new DCLib.DApp({
        slug: dapp_slug,
        contract: gameContract
      })
      callback()
    })
  })
}

describe('Play', () => {
  before(function (done) {
    initDCLibAndDApp(done)
  })

  let sandbox
  beforeEach(() => { sandbox = sinon.sandbox.create() })
  afterEach(() => {
    sandbox.restore()
    fetchMock.restore()
  })

  describe('DApp', function () {
    it('DApp created', function (done) {
      done(MyDApp.slug !== dapp_slug)
    })
  })

  describe('Account', function () {
    it('Balance', function (done) {
      DCLib.Account.info(function (info) {
        done(info.balance.eth * 1 === 0 || info.balance.bet * 1 === 0)
      })
    })
  })

  describe('Play', function () {
    let connection = {}
    before(function (done) {
      MyDApp.connect({
        bankroller : 'auto',
        paychannel : { deposit : dapp_deposit },
        gamedata   : {type:'uint', value:[1, 2, 3]}
      },
      function (connected, info) {
        connection = {connected:connected, info:info}
        setTimeout(function () { done() }, 2222)
      })
    })

    it('Check connection', function (done) {
      if (connection.connected) {
        done()
      } else {
        console.error(connection.info)
      }
    })

    const Roll = function (ok) {
      let bet = Math.random()
      let num = Math.floor(Math.random() * (40000 - 20000 + 1)) + 20000
      console.log('bet:', bet, 'num:', num)

      const rnd = DCLib.randomHash({bet:bet, gamedata:[num]})
      MyDApp.call('roll', [bet, num, rnd], function (result, advanced) {
        console.log('profit:', result.profit)
        ok()
      })
    }

    it('Call logic function Play 1', function (done) {
      Roll(done)
    })
    it('Call logic function Play 2', function (done) {
      Roll(done)
    })
    it('Call logic function Play 3', function (done) {
      Roll(done)
    })
  })

  describe('End game', function () {
    it('Disconnect', function (done) {
      MyDApp.disconnect(function (res) {
        console.log('disconnect result', res)
        done()
      })
    })
  })
})
