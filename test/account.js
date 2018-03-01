/* eslint-env mocha */
/* global DCLib expect sinon localStorage */

describe('Account', () => {
  let sandbox

  beforeEach(function () {
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('should unlock account', () => {
    const result = {
      address: '0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2',
      encrypt: 'encrypt(password, options)',
      openkey: '0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2',
      privateKey: '0xd8c226915b298530ee9ede352a1c9fe49f15a78167477e34731e26ccc7f577aa'
    }
    const localStorageSpy = sandbox.stub(localStorage, 'getItem').returns('xxx')
    const decryptSpy = sandbox.stub(DCLib.web3.eth.accounts, 'decrypt').returns(result)
    const addWalletSpy = sandbox.stub(DCLib.web3.eth.accounts.wallet, 'add')
    const unlock = DCLib.Account.unlockAccount('1234')

    addWalletSpy.restore()
    decryptSpy.restore()
    localStorageSpy.restore()

    expect(decryptSpy.getCall(0).args).to.deep.equal(['xxx', '1234'])
    expect(addWalletSpy.getCall(0).args).to.deep.equal([result.privateKey])
    expect(localStorageSpy.getCall(0).args).to.deep.equal(['web3wallet'])
    expect(unlock).to.deep.equal(result)
  })

  it('should return false when localstorage does not have web3wallet item', () => {
    const localStorageSpy = sandbox.stub(localStorage, 'getItem').returns(undefined)
    const unlock = DCLib.Account.unlockAccount('1234')

    localStorageSpy.restore()

    expect(unlock).to.equal(false)
    expect(localStorageSpy.getCall(0).args).to.deep.equal(['web3wallet'])
  })

  it('Should return private key', () => {
    const unlockSpy = sandbox.stub(DCLib.Account, 'unlockAccount').returns({ privateKey: 'xxx' })
    const privateKey = DCLib.Account.exportPrivateKey(true)
    unlockSpy.restore()

    expect(privateKey).to.equal('xxx')
    expect(unlockSpy.getCall(0).args).to.deep.equal([true])
  })

  it('should return wallet information', () => {
    const walletSpy = sandbox.stub(DCLib.Account, '_wallet').value({ privateKey: 'xxx', a: 'a' })
    const wallet = DCLib.Account.get()
    walletSpy.restore()

    expect(wallet).to.deep.equal({ a: 'a' })
  })

  it('should sign by key', () => {
    const removeSpy = sandbox.stub(DCLib.Utils, 'remove0x').returns('remove0xValue')
    const walletSignSpy = sandbox.stub().returns('signValue')
    const walletSpy = sandbox.stub(DCLib.Account, '_wallet').value({ sign: walletSignSpy })
    const sign = DCLib.Account.sign('value')
    removeSpy.restore()
    walletSpy.restore()

    expect(sign).to.equal('signValue')
    expect(removeSpy.getCall(0).args).to.deep.equal(['value'])
    expect(walletSignSpy.getCall(0).args).to.deep.equal(['remove0xValue'])
  })

  it('should reset wallet', () => {
    const localStorageSpy = sandbox.stub(localStorage, 'setItem')
    DCLib.Account.reset()

    localStorageSpy.restore()
    expect(localStorageSpy.getCall(0).args).to.deep.equal(['web3wallet', ''])
  })
})
