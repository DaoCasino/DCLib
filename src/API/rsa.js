import cryptico from 'js-cryptico'

const parseBigInt = (a, b) => {
  return new cryptico.RSAKey().parseInt(a, b)
}

export default class RSA {
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
}
