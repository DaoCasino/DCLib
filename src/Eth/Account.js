/* global fetch */
import conf from '../config/config'
import * as Utils from '../utils/utils'
import Store from '../API/DB'
import WEB3 from 'web3'
import {sign as signHash} from 'web3-eth-accounts/node_modules/eth-lib/lib/account.js'

let _config = {}
let _wallet = { openkey: false }

/**
 * Class for work with [Ethereum Account/Wallet](http://ethdocs.org/en/latest/account-management.html).
 *
 * ETH **account creates automatically** when DCLib init, and stored in Store.
 * For creating account lib user [web3.eth.accounts](web3js.readthedocs.io/en/1.0/web3-eth-accounts.html)
 *
 * ## About accounts in ETH
 * Accounts play a central role in Ethereum. There are two types of accounts: externally owned accounts (EOAs) and contract accounts. Here we focus on externally owned accounts, which will be referred to simply as accounts. Contract accounts will be referred to as contracts and are discussed in detail in Contracts. This generic notion of account subsuming both externally owned accounts and contracts is justified in that these entities are so called state objects. These entities have a state: accounts have balance and contracts have both balance and contract storage. The state of all accounts is the state of the Ethereum network which is updated with every block and which the network really needs to reach a consensus about. Accounts are essential for users to interact with the Ethereum blockchain via transactions.
 * If we restrict Ethereum to only externally owned accounts and allow only transactions between them, we arrive at an “altcoin” system that is less powerful than bitcoin itself and can only be used to transfer ether.
 *
 * @export
 * @class Account
 * @extends {DCLib}
 */
export default class Account {
  /**
  * @ignore
  */
  constructor (config, callback = false) {
    callback = callback || (() => {})

    _config = Object.assign(conf, config)
    // this._wallet = _wallet
    this._config = _config

    /**
     * @ignore
     */

    this.web3 = new WEB3(new WEB3.providers.HttpProvider(_config.rpc_url))

    // Init ERC20 contract
    this._ERC20 = new this.web3.eth.Contract(
      _config.contracts.erc20.abi,
      _config.contracts.erc20.address
    )

    callback()
  }

  async initAccount (callback = false) {
    const web3wallet = Store.getItem('web3wallet')

    if (web3wallet) {
      try {
        _wallet.openkey = `0x${JSON.parse(web3wallet).address}`
      } catch (e) {
        Utils.debugLog(['Error!', e], 'error')
      }
    }

    if (!_wallet.openkey) {
      let privateKey = await this.getAccountFromServer() || this.web3.eth.accounts.create().privateKey

      Store.setItem('web3wallet', JSON.stringify(
        this.web3.eth.accounts.encrypt(
          privateKey,
          this._config.wallet_pass
        )
      ))
      this.web3.eth.accounts.wallet.add(privateKey)

      Utils.debugLog([' 👤 New account created:', _wallet.openkey], _config.loglevel)
    }

    this.unlockAccount()
    if (callback) callback()
  }

  /**
   * @ignore
   */
  getAccountFromServer (localStorageStatusKey = 'statusGetAccountfromServer') {
    const status = Store.getItem(localStorageStatusKey)

    if (status) {
      if (status === 'wait') {
        return new Promise((resolve, reject) => {
          let waitTimer = () => {
            setTimeout(() => {
              const newStatus = Store.getItem(localStorageStatusKey)
              if (typeof newStatus === 'object' && newStatus.privateKey) {
                resolve(newStatus)
              } else {
                waitTimer()
              }
            }, 1000)
          }
          waitTimer()
        })
      }
      return
    }

    Store.setItem(localStorageStatusKey, 'wait')

    return fetch(_config.api_url + '?get=account')
      .then(res => res.json())
      .then(acc => {
        Utils.debugLog(['Server account data:', acc], _config.loglevel)
        Store.setItem(localStorageStatusKey, JSON.stringify(acc))
        _wallet.openkey = acc.address
        return acc.privateKey
      })
      .catch(e => {
        Utils.debugLog(e)
        return false
      })
  }

  /**
   * ## DCLib.Account.unlockAccount(password)
   * method recover user account on password
   *
   * @example
   * > DCLib.Account.unlockAccount('1234') // '1234' - User Password
   *
   *
   * @example
   * // method returns
   *
   * {
   *   address: "0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2"
   *   encrypt: encrypt(password, options)
   *   openkey: "0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2"
   *   privateKey: "0xd8c226915b298530ee9ede352a1c9fe49f15a78167477e34731e26ccc7f577aa"
   * }
   *
   * @param {String} [password=false] - User password for decrypt privateKey and unlock user account
   * @returns {Object} - _wallet object for the work of the Account
   *
   * @extends {Account}
   */
  unlockAccount (password = false) {
    password = password || this._config.wallet_pass

    if (!Store.getItem('web3wallet')) return false

    _wallet = this.web3.eth.accounts.decrypt(
      Store.getItem('web3wallet'),
      password
    )

    this.web3.eth.accounts.wallet.add(_wallet.privateKey)

    _wallet.openkey = _wallet.address

    /**
     * @ignore
     */
    this.signTransaction = _wallet.signTransaction

    return _wallet
  }

  /**
   * ## DCLib.Account.exportPrivateKey(password)
   * method get privateKey from account on user password
   *
   * @example
   * > DCLib.Account.exportPrivateKey('1234') // '1234' user password for decrypt private key
   *
   * @example
   * // method return
   * > "0xd8c226915b298530ee9ede352a1c9fe49f15a78167477e34731e26ccc7f577aa" // PrivateKey
   *
   * @param {string} [password=false] - user passwod for decrypt privateKey
   * @returns {string} - Private key for user account
   *
   * @extends {Account}
   */
  exportPrivateKey (password = false) {
    // if (_wallet.privateKey) return _wallet.privateKey

    return this.unlockAccount(password).privateKey
  }

  /**
   * ## DCLib.Account.get()
   * method getting account information
   *
   * @example
   * > DCLib.Account.get()
   *
   * @example
   * // method return
   *
   * {
   *   address: "0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2"
   *   encrypt: method
   *   openkey: "0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2"
   *   sign: method
   *   signTransaction: method
   * }
   *
   * @returns {Object} - account info and user method's
   *
   * @extends {Account}
   */
  get () {
    let w = Object.assign({}, _wallet)
    delete w.privateKey
    return w
  }

  /**
   * ## DCLib.Account.sign(raw)
   * Signs arbitrary data. This data is before
   * UTF-8 HEX decoded and enveloped as follows:
   * "\x19Ethereum Signed Message:\n" + message.length + message
   *
   * @example
   * > DCLib.Account.sign('Hello world')
   *
   * @example
   * // method return
   *
   * {
   *   message: "Hello world"
   *   messageHash: "0x25674ba4b416425b2ac42fdb33d0b0c20c59824a76e1ee4ecc04b8d48f8f6af7"
   *   r: "0x6a1bcec4ff132aadb511cfd83131e456fab8b94d92c219448113697b5d75308b"
   *   s: "0x3b805ef93c60b561b72d7c985fac11a574be0c2b2e4f3a8701cd01afa8e6edd7"
   *   v: "0x1b"
   *   signature: `"0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320b
   *   b8b0ba760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c"`
   * }
   *
   * @param {string} raw - message for sign
   * @returns {Object} - sign data
   *
   * @extends {Account}
   */
  sign (raw) {
    Utils.debugLog(['call %web3.eth.accounts.sign', ['font-weight:bold;']], _config.loglevel)
    Utils.debugLog('More docs: http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign', _config.loglevel)

    raw = Utils.remove0x(raw)
    Utils.debugLog(raw, _config.loglevel)
    return _wallet.sign(raw)
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
    if (!this.web3.utils.isHexStrict(hash)) {
      console.log(hash + ' is not correct hex')
      console.log('Use DCLib.Utils.makeSeed or Utils.soliditySHA3(your_args) to create valid hash')
    }

    return signHash(hash, Utils.add0x(this.exportPrivateKey()))
  }

  /**
   * ## method init DCLib.Account.reset()
   * method delete account of localStorage
   *
   * @example
   * DCLib.Account.reset()
   *
   * @returns - none
   * @memberOf {Account}
   */
  reset () { Store.setItem('web3wallet', '') }

  /**
   * This callback is
   * @callback onTxMined
   * @param {Object} receipt - information about mined trasaction
   */
  /**
   * ## DCLib.Account.sendBets(to, amount)
   * sendBets from current account to another account
   * you can use it with "await"
   *
   * @async
   *
   * @example
   * const r = await DCLib.Account.sendBets('0xAb5', 10)
   *
   * @example
   * // or classic callback
   * DCLib.Account.sendBets('0xAb5...', 10, function(receipt){ ... })
   *
   * @param  {string} to - bytes32 address
   * @param  {number} amount - how many bets send, 1 - 1BET, 22 - 22BET
   * @param  {onTxMined} callback - callback, when transacrion mined
   * @return {Promise.receipt} - return web3.send promise,
   *
   * @memberOf {Account}
   */
  async sendBets (toInput, amountInput, callback = false) {
    const to = Utils.add0x(toInput)
    const amount = Utils.bet2dec(amountInput)

    return this._ERC20.methods
      .transfer(to, amount)
      .send({
        from: this.get().openkey,
        gasPrice: this._config.gasPrice,
        gas: (await this._ERC20.methods.transfer(to, amount).estimateGas({from: this.get().openkey}))
      })
      .on('transactionHash', transactionHash => { Utils.debugLog('transactionHash:', transactionHash) })
      .on('receipt', receipt => { Utils.debugLog('receipt:', receipt) })
      .then(
        receipt => {
          if (callback) callback(receipt)
          return receipt
        },
        err => Utils.debugLog('Send bets .catch ', err)
      )
  }
}
