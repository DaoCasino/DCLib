import * as Utils from '../utils/utils'
import _config    from '../config/config'

/** max items in history */
const h_max = 100

/** @ignore */
const deposit = {
  player     : null,
  bankroller : null
}
/** @ignore */
const balance = {
  player     : 0,
  bankroller : 0
}
/** @ignore */
let _profit  = 0
/** Game history  */
let _history = []

export default class PayChannel {
  _setDeposits (player, bankroller) {
    if (deposit.player !== null) {
      console.warn('Deposit allready set')
    }

    deposit.player     = +player
    deposit.bankroller = +bankroller
    balance.player     = 1 * deposit.player
    balance.bankroller = 1 * deposit.bankroller

    return balance
  }

  _getBalance () {
    return balance
  }

  _getProfit () {
    return _profit
  }

  getDeposit () {
    return Utils.dec2bet(deposit.player)
  }

  getBalance () {
    return Utils.dec2bet(balance.player)
  }

  getBankrollBalance () {
    return Utils.dec2bet(balance.bankroller)
  }

  getProfit () {
    return Utils.dec2bet(_profit)
  }

  updateBalance (p) {
    return this.addTX
  }

  addTX (p) {
    _profit += p * 1
    balance.player     = deposit.player     + _profit
    balance.bankroller = deposit.bankroller - _profit

    _history.push({
      profit    : p,
      balance   : balance.player,
      timestamp : new Date().getTime()
    })

    _history = _history.splice(-h_max)

    return _profit
  }

  printLog () {
    if (_config.loglevel !== 'none') {
      console.groupCollapsed('Paychannel state:')
      console.table({
        Deposit          : this.getDeposit(),
        Player_balance   : this.getBalance(),
        Bankroll_balance : this.getBankrollBalance(),
        Profit           : this.getProfit()
      })
      console.groupCollapsed('TX History, last ' + h_max + ' items ' + _history.length)
      Utils.debugLog(_history, _config.loglevel)
      console.groupEnd()
      console.groupEnd()
    }
    return _history
  }

  reset () {
    Utils.debugLog('PayChannel::reset, set deposit balance profit to 0', _config.loglevel)
    deposit.player     = false
    deposit.bankroller = false
    balance.player     = 0
    balance.bankroller = 0
    _profit            = 0
    _history.push({ reset: true, timestamp: new Date().getTime() })
  }
}
