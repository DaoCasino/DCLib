import conf from 'config/config'
import * as Utils from 'utils/utils'

// import web3accounts  from 'web3/packages/web3-eth-accounts'
import WEB3 from 'web3'
// import {sign as signHash} from 'web3-eth-accounts/node_modules/eth-lib/lib/account.js'

let _config, ERC20

let _wallet = { openkey: false }

/**
 * Class for work with [Ethereum Account/Wallet](http://ethdocs.org/en/latest/account-management.html).
 *
 * ETH **account creates automatically** when DCLib init, and stored in localStorage.
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
  constructor (config, callback = false, log = true) {
    callback = callback || (() => {})

    _config = Object.assign(conf, config)

    /**
     * @ignore
     */
    this.web3 = new WEB3(new WEB3.providers.HttpProvider(_config.rpc_url))

    // this.initAccount(log)

    callback()
  }

  async initAccount (log = true) {
    if (log) console.groupEnd()
    if (log) console.group('Init Account')

    // Try to restore
    // wallet from localstorage
    if (localStorage && localStorage.web3wallet) {
      try {
        _wallet.openkey = '0x' + JSON.parse(localStorage.web3wallet).address
      } catch (e) { console.log('Error!', e) }
    }

    // Create new
    if (!_wallet.openkey) {
      const privateKey = await this.getAccountFromServer() || this.web3.eth.accounts.create().privateKey
      /* global localStorage */
      localStorage.web3wallet = JSON.stringify(
        this.web3.eth.accounts.encrypt(
          privateKey,
          _config.wallet_pass
        )
      )
      this.web3.eth.accounts.wallet.add(privateKey)

      if (log) console.info(' 👤 New account created:', _wallet.openkey)
    }

    if (log) {
      console.info(' 🔑 Account ' + _wallet.openkey + ' restored from localStorage')
      console.groupCollapsed('Methods DCLib.Account')
      console.info('DCLib.Account.get()')
      console.info('DCLib.Account.sign(raw_msg)')
      console.info('DCLib.Account.exportPrivateKey()')
      console.info('DCLib.Account.info(callback)')
      console.info('DCLib.Account.reset() - remove localstorage data')
      console.groupEnd()
    }

    this.unlockAccount()
  }
  /**
   * @ignore
   */
  getAccountFromServer () {
    if (localStorage.account_from_server) {
      if (localStorage.account_from_server === 'wait') {
        return new Promise((resolve, reject) => {
          let waitTimer = () => {
            setTimeout(() => {
              if (localStorage.account_from_server.privateKey) {
                resolve(localStorage.account_from_server)
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

    localStorage.account_from_server = 'wait'
    /* global fetch */
    return fetch('https://platform.dao.casino/faucet?get=account').then(res => {
      return res.json()
    }).then(acc => {
      console.log('Server account data:', acc)
      localStorage.account_from_server = JSON.stringify(acc)
      _wallet.openkey = acc.address
      return acc.privateKey
    }).catch(e => {
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
    password = password || _config.wallet_pass

    if (!localStorage.web3wallet) return false

    _wallet = this.web3.eth.accounts.decrypt(
      localStorage.web3wallet,
      password
    )

    this.web3.eth.accounts.wallet.add(_wallet.privateKey)

    _wallet.openkey = _wallet.address

    /**
     * @ignore
     */
    this.signTransaction = _wallet.signTransaction

    // Init ERC20 contract
    ERC20 = new this.web3.eth.Contract(
      _config.contracts.erc20.abi,
      _config.contracts.erc20.address
    )

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
   * @param {String} [password=false] - user passwod for decrypt privateKey
   * @returns {String} - Private key for user account
   *
   * @extends {Account}
   */
  exportPrivateKey (password = false) {
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
    console.info('call %web3.eth.accounts.sign', ['font-weight:bold;'])
    console.log('More docs: http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign')

    raw = Utils.remove0x(raw)
    console.info(raw)
    return _wallet.sign(raw)
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
  reset () { localStorage.web3wallet = '' }

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
   * @example
   * const r = await DCLib.Account.sendBets('0xAb5', 10)
   *
   * @example
   * // or classic callback
   * DCLib.Account.sendBets('0xAb5...', 10, function(receipt){ ... })
   *
   * @param  {String} to - bytes32 address
   * @param  {Number} amount - how many bets send, 1 - 1BET, 22 - 22BET
   * @param  {onTxMined} CB - callback, when transacrion mined
   * @return {Promise.receipt} - return web3.send promise,
   *
   * @memberOf {Account}
   */
  async sendBets (to, amount, callback = false) {
    to = Utils.add0x(to)
    amount = Utils.bet2dec(amount)

    console.info('Send ' + amount + ' bets to ' + to)

    return ERC20.methods
      .transfer(to, amount)
      .send({
        from: this.get().openkey,
        gasPrice: _config.gasPrice,
        gas: (await ERC20.methods.transfer(to, amount).estimateGas({from: this.get().openkey}))
      })
      .on('transactionHash', transactionHash => { console.info('transactionHash:', transactionHash) })
      .on('receipt', receipt => { console.info('receipt:', receipt) })
    // .on('confirmation', (confirmationNumber, receipt)=>{
    //  console.info('confirmation:',confirmationNumber, receipt)
    // })
    // .on('error', err=>{ console.log(err) })
      .then(receipt => {
        console.log('Send bets receipt', receipt)
        if (callback) callback(receipt)
        return receipt
      }).catch(err => {
        console.error('Send bets .catch ', err)
      })
  }
}
