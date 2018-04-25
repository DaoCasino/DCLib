import _config from '../config/config'
import Acc from './Account'
import * as Utils from '../utils/utils'
import {sign as signHash} from 'web3-eth-accounts/node_modules/eth-lib/lib/account.js'

/**
 * @ignore
 */
const Account = new Acc(_config, () => {}, false)
/**
 * @ignore
 */
const web3 = Account.web3

/**
 * Class with some helpers
 *
 * @export
 * @class EthHelpers
 * @extends {DCLib}
 */
export default class EthHelpers {
  /**
   * @ignore
   */
  constructor () {
    const waitAcc = done => {
      if (!Account.unlockAccount()) {
        setTimeout(() => {
          waitAcc(done)
        }, 1000)
        return
      }
      done()
    }

    /**
     * ERC20
     * This is web3.eth.contract instanse of our [ERC20 contract](https://ropsten.etherscan.io/address/0x95a48dca999c89e4e284930d9b9af973a7481287#code)
     *
     * @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md
     */
    waitAcc(() => {
      this.ERC20 = new web3.eth.Contract(
        _config.contracts.erc20.abi,
        _config.contracts.erc20.address
      )
    })
  }

  /**
   * This callback is
   * @callback accessBalance
   * @param {Object} receipt - access balance information
   */

  /**
   * ## Getting balances for Bets and Ethereum
   *
   * @param {String} address - Addres Ethereum account wallet
   * @param {accessBalance} callback - callback function then access balance information
   * @returns {Object} - return balance information
   *
   * @example
   * > DCLib.Eth.getBalances('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59') // '0x4d75..' address account
   *
   * @example
   * // method return
   *
   * {
   *   bets : 992.21
   *   eth  : "1.748053851"
   * }
   *
   * @memberOf DCLib
   */
  async getBalances (address, callback = false) {
    const [bets, eth] = await Promise.all([
      this.getBetBalance(address),
      this.getEthBalance(address)
    ])

    const res = { bets: bets, eth: eth }

    if (callback) callback(res)
    return res
  }

  /**
   * ## DCLib.Eth.getBetBalance
   * method need for getting balance in ETH
   *
   * @example
   * > DCLib.Eth.getEthBalance('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59')
   *
   * @example
   * // method return
   *
   * > 1.692211283
   *
   * @param {String} [address=false] - account addres for check balance
   * @param {Function} [callback=false] - access Ethereum balance promise
   * @returns {Promise} - ETH balance
   *
   * @memberOf DCLib
   */
  getEthBalance (address = false, callback = false) {
    if (!address) return

    return new Promise((resolve, reject) => {
      web3.eth.getBalance(address).then(value => {
        const balance = web3.utils.fromWei(value)
        resolve(balance)
        if (callback) callback(balance)
      }).catch(err => {
        Utils.debugLog(err, 'error')
        reject(err)
      })
    })
  }

  /**
   * ## DCLib.Eth.getBetBalance
   * method need for getting balance in BET
   *
   * @example
   * // example for method initialization
   *
   * > DCLib.Eth.getBetBalance('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59')
   *
   * @example
   * // example for method return Promise
   *
   * > 977.61
   *
   * @param {String} [address=false] - account addres for check balance
   * @param {Function} [callback=false] - access Ethereum balance promise
   * @returns {Promise} - BET balance
   *
   * @memberOf DCLib
   */
  getBetBalance (address = false, callback = false) {
    if (!address) return

    return new Promise((resolve, reject) => {
      this.ERC20.methods.balanceOf(address).call().then(value => {
        const balance = Utils.dec2bet(value)
        resolve(balance)
        if (callback) callback(balance)
      }).catch(err => {
        Utils.debugLog(err, 'error')
        reject(err)
      })
    })
  }

  /**
   * ## DCLib.Account.signHash(hash)
   * method sign hashMessage
   *
   *
   * @example
   * > DCLib.Account.signHash("0xAb23..")
     *
   * @example
   * // method return
   * > `0x6a1bcec4ff132aadb511cfd83131e456fab8b94d92c219448113697b5d75308b3b805
   *  ef93c60b561b72d7c985fac11a574be0c2b2e4f3a8701cd01afa8e6edd71b`
   *
   * @param {String} hash - message which need turn in hash
   * @returns {String} - hashed Message
   *
   * @memberOf {Account}
   */
  signHash (hash) {
    hash = Utils.add0x(hash)
    if (!web3.utils.isHexStrict(hash)) {
      console.log('err')
      Utils.debugLog(hash + ' is not correct hex', _config.loglevel)
      Utils.debugLog('Use DCLib.Utils.makeSeed or Utils.soliditySHA3(your_args) to create valid hash', _config.loglevel)
    }

    return signHash(hash, Utils.add0x(Account.exportPrivateKey()))
  }

  /**
   * Check ERC20 allowance and approve if need
   *
   * @param {string} spender - bytes32 addres
   * @param {int} amount - amount of BETs
   * @param {callback} [callback=false] - callback function
   * @return {Promise} - Approve promise
   */
  async ERC20approve (spender, amount, callback = false) {
    return new Promise(async (resolve, reject) => {
      let allowance = await this.ERC20.methods.allowance(Account.get().openkey, spender).call()

      if (allowance < amount || (amount === 0 && allowance !== 0)) {
        const approveAmount = amount

        const receipt = await this.ERC20.methods.approve(
          spender,
          approveAmount
        ).send({
          from: Account.get().openkey,
          gasPrice: 1.2 * _config.gasPrice,
          gas: _config.gasLimit
        }).on('transactionHash', transactionHash => {
          Utils.debugLog(['# approve TX pending', transactionHash], _config.loglevel)
        }).on('error', err => {
          Utils.debugLog(err, 'error')
          reject(err, true)
        })

        if (receipt.status !== '0x1') {
          reject(receipt, true)
          return
        }

        resolve(receipt, true)
      }

      resolve(null, true)

      if (callback) callback()
    })
  }
}
