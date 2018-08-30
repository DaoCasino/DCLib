/* global DCLIB_CONFIG CustomEvent */

import _config         from './config/config'
import * as Utils      from './utils/utils'
import EE              from 'event-emitter'
import Api             from './API/Api'
import rollbar         from 'rollbar'
import EthHelpers      from './Eth/helpers'
import Account         from './Eth/Account'
import DApp            from './DApps/DApp'
import * as messaging  from 'dc-messaging'

/**
 * @ignore
 */
const ourApi = new Api(_config)
/**
 * @ignore
 */
const Eth = new EthHelpers()

/**
 * @ignore
 */
const EC = function () {}; EE(EC.prototype)
/**
 * @ignore
 */
const E = new EC()

/**
 * @ignore
 */
let _ready = false

/**
 * Base class in global namespace.
 *
 * Check it in your browser `console.log(DCLib)`
 *
 * DCLib is javascript library for integrate [dao.casino blockchain protocol](https://github.com/DaoCasino/Whitepaper).
 * Interact with [bankroller](https://github.com/DaoCasino/BankRollerApp), use [Signidice random algorithm](https://github.com/DaoCasino/Whitepaper/blob/master/DAO.Casino%20WP.md#35-algorithm-implemented-in-mvp-of-daocasino-protocol), and paymentchannels.
 *
 *
 * @export
 * @class DCLib
 * @version 0.2.2
 */
export default class DCLib {
  /**
  * @ignore
  */
  constructor (signal = false) {
    this.version = '0.2.2'
    this.config = _config
    this.network = process.env.DC_NETWORK

    if (window.location.hash === 'showcase.dao.casino') {
      window.Rollbar = rollbar.init({
        accessToken: '1561ff6cec5043c287122e7d15e7902b',
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
          environment: 'production'
        }
      })
    }

    // Add signal
    messaging.upIPFS((signal || _config.signal))

    /**
    * little utilities
    */
    this.Utils = Utils

    /**
     * DApp constructor
     */
    this.DApp = DApp

    /**
     * Some helpers, such as getBetsBalance()
     */
    this.Eth = Eth

    E.on('_ready', () => {
      /* globals localStorage */
      if (typeof localStorage.requestBets === 'undefined') {
        localStorage.requestBets = true
        ourApi.addBets(this.Account.get().openkey)
      }

      if (process.env.DC_NETWORK === 'local') {
        this.Account.info(info => {
          if (info.balance.bet * 1 === 0 && localStorage && localStorage.web3wallet) {
            localStorage.clear()
            window.location.reload()
          }
        })
      }

      E.emit('ready')

      _ready = true

      if (typeof document !== 'undefined') {
        document.dispatchEvent((new CustomEvent('DCLib::ready', { detail:this.config })))
      }
    })

    /**
     * Account instance
     */
    this.Account = new Account(_config, () => setTimeout(() => E.emit('_ready'), 1))

    /**
     * WEB3 version 1.0  instance
     * We include web3 version 1.0 in our lib.
     * You can use all methods described in official documentation
     *
     * @see https://web3js.readthedocs.io/en/1.0/
     */
    this.web3 = this.Account.web3

    /**
     * ## Get ETH account information
     * @param {string} address - Addres Ethereum account wallet
     * @param {accessBalance} callback - callback function then access balance information
     * @returns {Object} - return balance information
     *
     * @example
     * > DCLib.Account.info('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59').then( r => {})
     *
     * @example
     * // method return
     * Object {
     *    openkey: address,
     *    Object {
     *       bets : 992.21
     *       eth  : "1.748053851"
     *    }
     * }
     */
    this.Account.info = async (address = false, callback = false) => {
      if (!_ready) {
        console.warn('DClib initialization in progress... try later :) ')
        return
      }

      if (!callback && typeof address === 'function') {
        callback = address
        address  = this.Account.get().address
      }

      address = address || this.Account.get().address

      const [bet, eth] = await Promise.all([
        this.Eth.getBetBalance(address),
        this.Eth.getEthBalance(address)
      ])

      const res = {
        openkey : address,
        balance : {
          eth : eth,
          bet : bet
        }
      }

      if (callback) callback(res)
      return res
    }
  }

  /**
     * Define DApp logic constructor function
     *
     * @example
     * DCLib.defineDAppLogic('game_name', function() {
     *      ...game_logic
     * })
     *
     * @param {string} dappSlug         unique slug of your dapp
     * @param {function} logicConstructor constructor Dapp logic
     */
  defineDAppLogic (dappSlug, LogicConstructor) {
    if (!window.DAppsLogic) { window.DAppsLogic = {} }

    if (typeof (new LogicConstructor()).Game !== 'function') {
      throw new Error('DAppsLogic require function "Game"')
    }

    // window.DAppsLogic[
    //   (!process.env.DC_NETWORK ||
    //     process.env.DC_NETWORK !== 'local' ||
    //     process.env.DC_NETWORK === 'stage'
    //   ) ? dappSlug : `${dappSlug}_dev`] = LogicConstructor
    window.DAppsLogic[dappSlug] = LogicConstructor
  }

  /**
  * Callback for triger DClib e.
  *
  * @callback eventCallback
  */
  /**
   * ## DCLib.on(event, callback)
   * adds the functional to event
   *
   * @todo add examples and information about method
   *
   * @param {Event} event - event name
   * @param {eventCallback} callback - function then functional for event
   *
   * @memberOf DCLib
   */
  on (event, callback) {
    if (_ready) callback(_ready)
    E.on(event, callback)
  }

  /**
   * ## DCLib.randomHash()
   * Generate random hash
   *
   * @example
   * // example for method initialization
   *
   * > DCLib.randomHash()
   *
   * @example
   * // example for method return
   *
   * > "confirm(0x26157e636aea611dd8bb7bee2258fcf84e6714a75112392886ceafe6b19bf03f)"
   *
   * @returns - random Hash
   *
   * @memberOf DCLib
   */
  randomHash (data) {
    if (!data || !data.bet || !data.gamedata || typeof data.gamedata !== 'object') {
      throw new Error('Invalid data for randomHash, need: {bet:100, gamedata:array} ')
    }

    data.bet = Utils.bet2dec(data.bet)

    return { rnd: data }
  }

  /**
   * ## DCLib.numFromHash(randomHash, min=0, max=10)
   * Generate random number of hash
   *
   * @example
   * // example for method initialization
   *
   * > DCLib.numFromHash("dsadafkojodjaskfjoasjdoasfjaspfdjoqijeeqwjeq")
   *
   * @example
   * // example for method return
   *
   * > 44
   *
   * @param {string} randomHash - hash for generate random num
   * @param {number} [min=0] - min value for generate default = 0
   * @param {number} [max=100] - max value for generate default = 100
   * @returns {number} - Random number
   *
   * @memberOf DCLib
   */
  numFromHash (randomHash, min = 0, max = 100) {
    if (min > max) { let c = min; min = max; max = c }
    if (min === max) return max
    max += 1

    const hashBN = new this.web3.utils.toBN(Utils.remove0x(randomHash), 16)
    const divBN  = new this.web3.utils.toBN(max - min, 10)
    const divRes = hashBN.divmod(divBN)

    return +divRes.mod + min
  }

  /**
   * ## DCLib.fauset(address=false)
   * method need for add free bets on account
   * @async
   *
   * @example
   * // example for method initialization without param
   *
   * DCLib.faucet()
   *
   * @example
   * // example for method initialization with param
   *
   * DCLib.faucet('0xd4e9f60fc84b97080a1803cf2d4e1003313a2ea2')
   *
   * @param {string} [address=false] - account address
   * @returns {Promise<Object>}
   *
   * @memberOf DCLib
   */

  async faucet (address = false, callback = false) {
    address = address || this.Account.get().openkey
    const recipe = await ourApi.addBets(address)
    return recipe
  }

  /**
   * ## DCLib.sigRecover(rawMsg, signedMsg)
   * Like sigHashRecover but remove ’0x’(if exist) from rawMsg.
   * Recovers the Ethereum address which was used to sign the given data.
   *
   * @see http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#recover
   *
   * @example
   * // example for method initialization
   *
   * DCLib.sigRecover(
   *  `0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede`,
   *  `0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba
   *   760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c`
   * )
   *
   * @example
   * // example for method return Eth address
   *
   * > 0x621e24a7f55843a69766946d6b4b5938423c4a33
   *
   * @param {string} rawMsg - hash message for recover.
   * @param {string} signedMsg - signature message for recover.
   * @returns {string} - the Ethereum address used to sign this data.
   *
   * @memberOf DCLib
   */
  sigRecover (rawMsg, signedMsg) {
    rawMsg = Utils.remove0x(rawMsg)
    return this.web3.eth.accounts.recover(rawMsg, signedMsg).toLowerCase()
  }

  /**
   * ## DCLib.sigHashRecover(rawMsg, signedMsg)
   * Recovers the Ethereum address which was used to sign the given data.
   * to sign the given data.
   *
   * @see http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#recover
   *
   * @example
   * // example for method initialization
   *
   * DCLib.sigRecover(
   *  `0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede`,
   *  `0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba
   *   760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c`
   * )
   *
   * @example
   * // example for method return Eth address
   *
   * > 0x621e24a7f55843a69766946d6b4b5938423c4a33
   *
   * @param {string} rawMsg - hash message for recover.
   * @param {string} signedMsg - signature message for recover.
   * @returns {string} - the Ethereum address used to sign this data.
   *
   * @memberOf DCLib
   */
  sigHashRecover (rawMsg, signedMsg) {
    return this.web3.eth.accounts.recover(rawMsg, signedMsg).toLowerCase()
  }

  /**
   * ## DCLib.checkSig(rawMsg, signedMsg, needAddress)
   * Checks. whether this address refers to a signed message
   *
   * @example
   * // example for method initialization
   * // when the address passes the test
   *
   * DCLib.checkSig(
   * '0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede',
   * `0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba
   * 760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c`,
   * '0x621e24a7f55843a69766946d6b4b5938423c4a33')
   *
   * > true // because the address is being checked
   *
   * @example
   * // example for method initialization
   * // when the address fails validation
   *
   * DCLib.checkSig('0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede',
   * '0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba760038313b7e2a
   * 01674e773e5c2dec046b09fde1560dca38f35ca928765631c',
   * '0x621e24a7f55843a69766946d6b4b5938423c2a33')
   *
   * > false // because the address does not pass the test
   *
   * @param {string} rawMsg - hash message
   * @param {string} signedMsg - signature message
   * @param {string} needAddress - check address
   * @returns {boolean} - true/false
   *
   * @memberOf DCLib
   */
  checkSig (rawMsg, signedMsg, needAddress) {
    rawMsg = Utils.remove0x(rawMsg)
    return (needAddress.toLowerCase() === this.web3.eth.accounts.recover(rawMsg, signedMsg).toLowerCase())
  }

  /**
   * ## DCLib.checkHashSig(rawMsg, signedMsg, needAddress)
   *
   * the method checks the address for the signature property
   * by means of the function web3.account.recover into which
   * the hash message and signature are transferred,
   * and if the returned result is equal to the transmitted address,
   * it returns true otherwise false
   *
   * @example
   * // if address valid
   *
   * DCLib.checkHashSig("0x43ecd41650080ac1f83a0251c99851e81cb62896188a01fbbf6113b845145f8c",
   * `0xf27efaf10b963b69fee76879424c70ace9c4d1b0d8f40ecf7680aa09a420bec473d5fa0b1ccdd17
   * 62f82f0eb4187637ffdda48b3d68ec71c1ce4f8aa4a28f2d41c`,
   * '0xdd47ea2258e80d5596df09bec42d33c7553bb9ed')
   *
   * > true
   *
   *
   * @example
   * // if address don't valid
   *
   * DCLib.checkHashSig("0x43ecd41650080ac1f83a0251c99851e81cb62896188a01fbbf6113b845145f8c",
   * `0xf27efaf10b963b69fee76879424c70ace9c4d1b0d8f40ecf7680aa09a420bec473d5fa0b1
   * ccdd1762f82f0eb4187637ffdda48b3d68ec71c1ce4f8aa4a28f2d41c`,
   * '0xdd47ea2258e80d5596df09bec42d33c7553b2223')
   *
   * > false
   *
   * @param {string} rawMsg - message for check
   * @param {string} signedMsg - message signature for chek
   * @param {string} needAddress - address which the need check
   * @returns {bollean} - true/false
   *
   * @memberOf DCLib
   */
  checkHashSig (rawMsg, signedMsg, needAddress) {
    return (needAddress.toLowerCase() === this.web3.eth.accounts.recover(rawMsg, signedMsg).toLowerCase())
  }
}
