/* global DCLib describe it */
// const assert = chai.assert

describe('DCLib', function() {

  before('should init account', function() {
    this.timeout(20000)
    return DCLib.Account.initAccount()
  })

  it('should return random hash', () => {
    const randomHash = DCLib.randomHash()
    expect(randomHash).to.match(/^confirm\(0x[0-9a-z]+\)$/)
  })

  it('should return true when sign message is correct', function () {
    this.timeout(20000)
    const s = DCLib.Utils.makeSeed()
    const checkSig = DCLib.checkSig(s, DCLib.Account.signHash(s), DCLib.Account.get().openkey)
    // expect(checkSig).to.equal(true)
  })

  it('should return false when sign message is failed', function () {
    this.timeout(20000)
    const s = '0xA312h31kj4h4l1hk34j123313j123141r1d1c2l3kl12'
    const checkSig = DCLib.checkSig(s, DCLib.Account.signHash(s), DCLib.Account.get().openkey)
    expect(checkSig).to.equal(false)
  })

  it('should return true when sign hash message is correct', function () {
    this.timeout(20000)
    const s = DCLib.Utils.makeSeed()
    const checkSig = DCLib.checkHashSig(s, DCLib.Account.signHash(s), DCLib.Account.get().openkey)
    expect(checkSig).to.equal(true)
  })

  it('should return false when sign hash message is failed', function () {
    this.timeout(20000)
    const s = 'j312h31kj4h4l1hk34j123313j123141r1d1c2l3kl12'
    const checkSig = DCLib.checkHashSig(s, DCLib.Account.signHash(s), DCLib.Account.get().openkey)
    expect(checkSig).to.equal(false)
  })

  it('should return string when sig hash recove', function () {
    this.timeout(10000)
    const s = DCLib.Utils.makeSeed()
    const sigHashRecover = DCLib.sigHashRecover(s, DCLib.Account.signHash(s))
    expect(sigHashRecover).to.be.a('string')
  })

  it('should return string when sig recove', function () {
    this.timeout(10000)
    const s = DCLib.Utils.makeSeed()
    const sigRecover = DCLib.sigRecover(s, DCLib.Account.signHash(s))
    expect(sigRecover).to.be.a('string')
  })

/*
  it('should add free bets', async function() {
    this.timeout(20000)
    const faucet = await DCLib.faucet()
    console.log(faucet)
  })
*/  

  it('should return number from hash', function () {
    const randomHash = DCLib.randomHash()
    const min = Math.floor(Math.random(10) * 10)
    const max =  11 + Math.floor(Math.random(50) * 50)
    const numFromHash = DCLib.numFromHash(randomHash.slice(8, -1), min, max)
    expect(numFromHash).to.be.a('number')
    expect(numFromHash >= min && numFromHash <= max).to.equal(true)
  })

  it('Define DApp logic', (done) => {
    DCLib.defineDAppLogic('myGame_v1', done)

    window.MyDapp = new DCLib.DApp({ slug: 'myGame_v1' })
  })
})
