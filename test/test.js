/* eslint-env mocha */
/* global DCLib expect sinon assert */

describe('DCLib', () => {
  it('should return random hash', () => {
    const randomHash = DCLib.randomHash()
    expect(randomHash).to.match(/^confirm\(0x[0-9a-z]+\)$/)
  })

  it('should return true when sign message is correct', () => {
    const recoverSpy = sinon.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const checkSig = DCLib.checkSig('', '', 'xxx')

    recoverSpy.restore()
    assert(recoverSpy.called)
    expect(checkSig).to.equal(true)
  })

  it('should return false when sign message is failed', () => {
    const recoverSpy = sinon.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX-f')
    const checkSig = DCLib.checkSig('', '', 'xxx')

    recoverSpy.restore()
    assert(recoverSpy.called)
    expect(checkSig).to.equal(false)
  })

  it('should return true when sign hash message is correct', () => {
    const recoverSpy = sinon.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const checkSig = DCLib.checkHashSig('', '', 'xxx')

    recoverSpy.restore()
    assert(recoverSpy.called)
    expect(checkSig).to.equal(true)
  })

  it('should return false when sign hash message is failed', () => {
    sinon.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX-f')
    const checkSig = DCLib.checkHashSig('', '', 'xxx')

    DCLib.web3.eth.accounts.recover.restore()
    expect(checkSig).to.equal(false)
  })

  it('should return string when sig hash recove', () => {
    sinon.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const sigHashRecover = DCLib.sigHashRecover('', '')

    DCLib.web3.eth.accounts.recover.restore()
    expect(sigHashRecover).to.equal('xxx')
  })

  it('should return string when sig recove', () => {
    sinon.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const sigHashRecover = DCLib.sigRecover('', '')

    DCLib.web3.eth.accounts.recover.restore()
    expect(sigHashRecover).to.equal('xxx')
  })

  it('should return number from hash', () => {
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
