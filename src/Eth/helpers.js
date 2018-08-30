import Acc        from './Account'
import _config    from '../config/config'
import * as Utils from '../utils/utils'

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

      this.getBalances(Account.get().openkey).then(balance => {
        const getAccount = localStorage.getItem('statusGetAccfromFaucet') || {}

        if ((balance.bets * 1 < 5 || Number(balance.eth).toFixed(1) * 1 < 0.2) &&
          !getAccount.error && getAccount.error === 'undefined'
        ) {
          localStorage.clear()
          window.location.reload()
        }
      })
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
      if (!this.ERC20) { reject(new Error('ERC20 not initializated')) }
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

        if (!['0x01', '0x1', true].includes(receipt.status)) {
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
