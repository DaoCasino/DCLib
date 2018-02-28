/* eslint-env mocha */
/* global DCLib expect assert sinon localStorage */

describe('Account', () => {
  it('should unlock account with password', () => {
    localStorage.setItem('web3wallet', 'xxx')
    const result = {
      address: '0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2',
      encrypt: 'encrypt(password, options)',
      openkey: '0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2',
      privateKey: '0xd8c226915b298530ee9ede352a1c9fe49f15a78167477e34731e26ccc7f577aa'
    }
    const decryptSpy = sinon.stub(DCLib.web3.eth.accounts, 'decrypt').returns(result)
    const addWalletSpy = sinon.stub(DCLib.web3.eth.accounts.wallet, 'add')
    const unlock = DCLib.Account.unlockAccount('1234')
    addWalletSpy.restore()
    decryptSpy.restore()
    localStorage.removeItem('web3wallet')
    assert(decryptSpy.called)
    expect(decryptSpy.getCall(0).args).to.deep.equal(['xxx', '1234'])
    assert(addWalletSpy.called)
    expect(addWalletSpy.getCall(0).args).to.deep.equal([result.privateKey])
    expect(unlock).to.deep.equal(result)
  })
})
