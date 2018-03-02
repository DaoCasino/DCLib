import * as Utils from 'utils/utils'
import _config    from '../config/config'
/** max items in history */
const h_max   = 100

/** @ignore */
const deposit = {
  player     : false,
  bankroller : false
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

/**
 * Class for change Payment Channel Contract state.
 *
 * Instanse of this class, autoinject in your logic
 * Lib automatically send transactions to [payment channel ethereum contract](https://github.com/DaoCasino/Template/blob/master/contracts/examples/paymentChannel.sol)
 * all as you need is fixing change user balance with .addTX method.
 * Also you can get current state getBalance getDeposit or printLog for debug.
 *
 * ## what is paychannel
 * Payment Channel Contract is class of techniques designed to allow users to make multiple transactions without commiting all of the transactions to the block chain. In a payment channel, only two transactions are added to the block chain but an unlimited or nearly unlimted number of payments can be made between the participants.
 *
 * @export
 * @class PayChannel
 * @extends {DApp}
 */
export default class PayChannel {
  /**
     * @ignore
     */
  constructor (bankroller_deposit) {
    deposit.bankroller = bankroller_deposit

    if (_config.loglevel !== 'none') {
      Utils.debugLog('paychannel injected in dapp logic', _config.loglevel)
      Utils.debugLog('Now your logic has methods for work with payment channel', _config.loglevel)
      console.table({
        getDeposit : 'for get start deposit',
        getBalance : 'current user balance',
        getProfit  : 'How many user up, balance-deposit',

        addTX      : 'Change current user balance, ex: addTX(-1) ',

        printLog   : 'console.log channel state'
      })
      console.groupEnd()
    }
  }

  /**
     * Change deposit  for game
     *
     * @example
     * window.MyDApp.logic.payChannel.setDeposit(1)
     *
     * > PayChannel::User deposit set 100000000, now user balance: 100000000
     * > 100000000
     *
     * @param {Number} d - number value to set deposit
     * @returns {Number} - New deposit
     *
     * @memberOf PayChannel
     */
  setDeposit (d) {
    if (deposit.player !== false) {
      Utils.debugLog('Deposit allready set', 'error')
      return
    }

    deposit.player     = Utils.bet2dec(d)
    deposit.bankroller = Utils.bet2dec(d * 2)
    balance.player     = (1 * deposit.player)
    balance.bankroller = (1 * deposit.bankroller)
    Utils.debugLog(['PayChannel::User deposit set ' + deposit.player + ' bankroller deposit set' + deposit.bankroller + ', now user balance:', deposit.player], _config.loglevel)
    return balance
  }

  /**
     * View deposit for game
     *
     * @example
     * window.MyDApp.logic.payChannel.getDeposit()
     *
     * > PayChannel::getDeposit: 1
     *
     * @returns {Number} - Game deposit
     *
     * @memberOf PayChannel
     */
  getDeposit () {
    Utils.debugLog(['PayChannel::getDeposit', deposit.player], _config.loglevel)
    return Utils.dec2bet(deposit.player)
  }

  /**
     * view game balance
     *
     * @example
     * window.MyDApp.logic.payChannel.getBalance()
     *
     * > PayChannel::getBalance: 1
     *
     * @returns {Number} - Game balance
     *
     * @memberOf PayChannel
     */
  getBalance () {
    Utils.debugLog(['PayChannel::getBalance', balance.player], _config.loglevel)
    return Utils.dec2bet(balance.player)
  }

  getBankrollBalance () {
    Utils.debugLog(['PayChannel::getBankrollBalance', balance.bankroller], _config.loglevel)
    return Utils.dec2bet(balance.bankroller)
  }

  updateChannelBalance (p, convert = false) {
    !convert ? this.addTX(p) : this.addTX(p, true)
  }

  /**
     * View game proffit
     *
     * @example
     * window.MyDApp.logic.payChannel.getProfit()
     *
     * > PayChannel::getProfit: 0
     *
     * @returns {Number} - Game proffit
     *
     * @memberOf PayChannel
     */
  getProfit () {
    Utils.debugLog(['PayChannel::getProfit', _profit], _config.loglevel)
    return Utils.dec2bet(_profit)
  }

  /**
     * @ignore
     */
  _getProfit () {
    Utils.debugLog(['PayChannel::_getProfit', _profit], _config.loglevel)
    return _profit
  }

  /**
     * Add BET transaction to channel
     *
     * @example
     * .payChannel.addTX( 1 )
     * .payChannel.addTX( +2 )
     * .payChannel.addTX( '2.5' )
     * .payChannel.addTX( -2.5 )
     *
     * .payChannel.printLog( -2.5 )
     *
     * @param {string|int} profit - TX value in BETs
     * @param {bool} convert - convet from BET to microbet, default - true
     */
  addTX (p, convert = true) {
    Utils.debugLog('PayChannel::addTX', _config.loglevel)

    if (convert) {
      p = Utils.bet2dec(p)
      Utils.debugLog(['PayChannel::addTX - convert BET to minibet', p], _config.loglevel)
    }

    if (('' + p).indexOf('.') > -1) {
      throw new Error('addTX ' + p + ' invalid value, set convert param to true')
    }

    _profit += p * 1

    balance.player     = deposit.player     + _profit
    balance.bankroller = deposit.bankroller - _profit
    Utils.debugLog(_profit, _config.loglevel)
    Utils.debugLog(balance, _config.loglevel)
    _history.push({
      profit    : p,
      balance   : balance.player,
      timestamp : new Date().getTime()
    })

    _history = _history.splice(-h_max)
    return Utils.dec2bet(_profit)
  }

  /**
     * Print log in console
     *
     * @example
     * window.MyDApp.logic.payChannel.printLog()
     *
     * @return {Array} - history array
     */
  printLog () {
    if (_config.loglevel !== 'none') {
      console.groupCollapsed('Paychannel state:')
      console.table({
        Deposit          : this.getDeposit(),
        player_balance   : this.getBalance(),
        bankroll_balance : this.getBankrollBalance(),
        Profit           : this.getProfit()
      })
      console.groupCollapsed('TX History, last ' + h_max + ' items ' + _history.length)
      Utils.debugLog(_history, _config.loglevel)
      console.groupEnd()
      console.groupEnd()
    }

    return _history
  }

  /**
     * Reset balance, depot and proffit game
     * @example
     * window.MyDApp.logic.payChannel.reset()
     *
     * > 'PayChannel::reset, set deposit balance profit to 0'
     *
     * @memberOf PayChannel
     */
  reset () {
    Utils.debugLog('PayChannel::reset, set deposit balance profit to 0', _config.loglevel)
    deposit.player     = false
    deposit.bankroller = false
    balance.player     = 0
    balance.bankroller = 0
    _profit            = 0
    _history.push({reset: true, timestamp: new Date().getTime()})
  }
}
