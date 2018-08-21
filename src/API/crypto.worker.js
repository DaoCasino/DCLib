import cryptico           from 'js-cryptico'
import _config            from '../config/config'
import promiseWorker      from 'promise-worker/register'
import Acc                from '../Eth/Account'
import * as Utils         from '../utils/utils'
import {sign as signHash} from 'eth-lib/lib/account.js'

const Account = new Acc(_config, () => {}, false)
const web3    = Account.web3
// Account.initAccount()

const parseBigInt = (a, b) => {
  return new cryptico.RSAKey().parseInt(a, b)
}

class Crypto {
  constructor (publickExponent = '10001') {
    this.RSA = new cryptico.RSAKey()
    this.publicExponent = publickExponent
  }

  // Method for creation public RSA keys for verify (for Player)
  create (modulus, exponent = '10001') {
    const publicExponent = exponent || this.publicExponent
    this.RSA.setPublic(modulus, publicExponent)
  }

  // Verification rawMsg and Signed msg
  verify (message, signedMessage) {
    let msg        = parseBigInt(message, 16)
    let sigMsg     = parseBigInt(signedMessage, 16)
    msg            = msg.mod(this.RSA.n)
    let newMessage = this.RSA.doPublic(sigMsg)
    return newMessage.equals(msg)
  }

  signHash (hash) {
    hash = Utils.add0x(hash)
    if (!web3.utils.isHexStrict(hash)) {
      console.log('err')
      Utils.debugLog(hash + ' is not correct hex', _config.loglevel)
      Utils.debugLog('Use DCLib.Utils.makeSeed or Utils.soliditySHA3(your_args) to create valid hash', _config.loglevel)
    }

    return signHash(hash, Utils.add0x(Account.exportPrivateKey()))
  }

  checkHashSig (rawMsg, signedMsg, needAddress) {
    return (needAddress.toLowerCase() === web3.eth.accounts.recover(rawMsg, signedMsg).toLowerCase())
  }
}

const crypto = new Crypto()

promiseWorker(async msg => {
  const action = msg.action
  const data   = msg.data

  if (action === 'sign_hash' && data.hash) {
    return crypto.signHash(data.hash)
  }

  if (action === 'create_rsa') {
    if (!data._N || !data._E) throw new Error('Inc data')
    crypto.create(Utils.remove0x(data._N), data._E)
    return true
  }

  if (action === 'check_sign') {
    if ((!data.verify_hash_args && !data.verify_hash) ||
    !data.bankroller_address ||
    !data.bankroller_sign) {
      throw new Error('Incomplete data')
    }

    const verify_hash = data.verify_hash || Utils.sha3(...data.verify_hash_args)

    if (!crypto.checkHashSig(verify_hash, data.bankroller_sign, data.bankroller_address)) {
      throw new Error('Invalid sign')
    }

    return true
  }

  if (action === 'rsa_verify') {
    if (!data.rnd_hash || !data.rnd_sign) throw new Error('Incompleate data')
    if (!crypto.verify(Utils.sha3(...data.rnd_hash), data.rnd_sign)) throw new Error('Invalid rsa verify')
    return true
  }
})
