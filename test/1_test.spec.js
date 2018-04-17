/* eslint-env mocha */
/* global DCLib expect sinon */

describe.skip('DCLib', () => {
  let sandbox

  beforeEach(() => { sandbox = sinon.sandbox.create() })

  afterEach(() => { sandbox.restore() })

  it('should return random hash', () => {
    const randomHash = DCLib.randomHash()
    expect(randomHash).to.match(/^confirm\(0x[0-9a-z]+\)$/)
  })

  it('should return true when sign message is correct', () => {
    const recoverSpy = sandbox.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const remove0xSpy = sandbox.stub(DCLib.Utils, 'remove0x').returns('remove0xRawMsg')
    const checkSig = DCLib.checkSig('rawMsg', 'signedMsg', 'xxx')

    expect(checkSig).to.equal(true)
    expect(remove0xSpy.getCall(0).args).to.deep.equal(['rawMsg'])
    expect(recoverSpy.getCall(0).args).to.deep.equal(['remove0xRawMsg', 'signedMsg'])
  })

  it('should return false when sign message is failed', () => {
    const recoverSpy = sandbox.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX-f')
    const remove0xSpy = sandbox.stub(DCLib.Utils, 'remove0x').returns('remove0xRawMsg')
    const checkSig = DCLib.checkSig('rawMsg', 'signedMsg', 'xxx')

    expect(checkSig).to.equal(false)
    expect(remove0xSpy.getCall(0).args).to.deep.equal(['rawMsg'])
    expect(recoverSpy.getCall(0).args).to.deep.equal(['remove0xRawMsg', 'signedMsg'])
  })

  it('should return true when sign hash message is correct', () => {
    const recoverSpy = sandbox.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const checkSig = DCLib.checkHashSig('rawMsg', 'signedMsg', 'xxx')

    expect(checkSig).to.equal(true)
    expect(recoverSpy.getCall(0).args).to.deep.equal(['rawMsg', 'signedMsg'])
  })

  it('should return false when sign hash message is failed', () => {
    const recoverSpy = sandbox.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX-f')
    const checkSig = DCLib.checkHashSig('rawMsg', 'signedMsg', 'xxx')

    expect(checkSig).to.equal(false)
    expect(recoverSpy.getCall(0).args).to.deep.equal(['rawMsg', 'signedMsg'])
  })

  it('should return string when sig hash recove', () => {
    const recoverSpy = sandbox.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const sigHashRecover = DCLib.sigHashRecover('rawMsg', 'signedMsg')

    expect(sigHashRecover).to.equal('xxx')
    expect(recoverSpy.getCall(0).args).to.deep.equal(['rawMsg', 'signedMsg'])
  })

  it('should return string when sig recove', () => {
    const recoverSpy = sandbox.stub(DCLib.web3.eth.accounts, 'recover').returns('XXX')
    const remove0xSpy = sandbox.stub(DCLib.Utils, 'remove0x').returns('remove0xRawMsg')
    const checkSig = DCLib.sigRecover('rawMsg', 'signedMsg')

    expect(checkSig).to.equal('xxx')
    expect(remove0xSpy.getCall(0).args).to.deep.equal(['rawMsg'])
    expect(recoverSpy.getCall(0).args).to.deep.equal(['remove0xRawMsg', 'signedMsg'])
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
