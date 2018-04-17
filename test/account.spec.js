/* eslint-env mocha */
/* global DCLib expect sinon localStorage fetchMock */

describe.skip('Account', () => {
  let sandbox

  beforeEach(() => { sandbox = sinon.sandbox.create() })

  afterEach(() => {
    sandbox.restore()
    fetchMock.restore()
    DCLib.Account._wallet = { openkey: false }
    DCLib.Account._config = {}
    DCLib.Account._ERC20 = {}
  })

  it('should init account when account is save in localStorage', async () => {
    const localStorageGetItemStub = sandbox
      .stub(localStorage, 'getItem')
      .returns(JSON.stringify({ address: 'web3walletAddress' }))
    const unlockAccountStub = sandbox.stub(DCLib.Account, 'unlockAccount')
    await DCLib.Account.initAccount(false)

    expect(localStorageGetItemStub.getCall(0).args).to.deep.equal(['web3wallet'])
    expect(unlockAccountStub.getCall(0).args).to.deep.equal([])
    expect(DCLib.Account._wallet).to.deep.equal({ openkey: '0xweb3walletAddress' })
  })

  it('should init account when account is not save in localStorage but exists in server', async () => {
    const localStorageGetItemStub = sandbox
      .stub(localStorage, 'getItem')
      .returns(undefined)
    sandbox.stub(DCLib.Account, '_wallet').value({ openkey: false })
    const getAccountFromServerStub = sandbox
      .stub(DCLib.Account, 'getAccountFromServer')
      .returns(Promise.resolve('privateKeyValue'))
    sandbox.stub(DCLib.Account, '_config').value({ wallet_pass: 'walletPassValue' })
    const encryptStub = sandbox.stub(DCLib.web3.eth.accounts, 'encrypt').returns({ value: 'encrypt' })
    const localStorageSetItemStub = sandbox.stub(localStorage, 'setItem')
    const walletAddStub = sandbox.stub(DCLib.web3.eth.accounts.wallet, 'add')
    const unlockAccountStub = sandbox.stub(DCLib.Account, 'unlockAccount')
    await DCLib.Account.initAccount(false)

    expect(localStorageGetItemStub.getCall(0).args).to.deep.equal(['web3wallet'])
    expect(getAccountFromServerStub.getCall(0).args).to.deep.equal([])
    expect(encryptStub.getCall(0).args).to.deep.equal(['privateKeyValue', 'walletPassValue'])
    expect(localStorageSetItemStub.getCall(0).args).to.deep.equal([
      'web3wallet',
      JSON.stringify({ value: 'encrypt' })
    ])
    expect(walletAddStub.getCall(0).args).to.deep.equal(['privateKeyValue'])
    expect(unlockAccountStub.getCall(0).args).to.deep.equal([])
  })

  it('should unlock account', () => {
    const result = {
      address: '0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2',
      encrypt: 'encrypt(password, options)',
      openkey: '0xD4E9F60fc84b97080A1803CF2D4E1003313a2Ea2',
      privateKey: '0xd8c226915b298530ee9ede352a1c9fe49f15a78167477e34731e26ccc7f577aa'
    }
    sandbox.stub(DCLib.Account, '_config').value({
      wallet_pass: 'walletPassValue',
      contracts: {
        erc20: {
          abi: 'fakeAbi',
          address: 'fakeAddres'
        }
      }
    })
    const createContractStub = sandbox.stub(DCLib.web3.eth, 'Contract')
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
    expect(createContractStub.getCall(0).args).to.deep.equal(['fakeAbi', 'fakeAddres'])
    expect(unlock).to.deep.equal(result)
  })

  it('should return account from server', async () => {
    fetchMock.get('*', { address: 'fakeAddress', privateKey: 'fakePrivateKey' })
    const localStorageStub = sandbox.stub(localStorage, 'getItem').returns(undefined)
    const localStorageSetItemStub = sandbox.stub(localStorage, 'setItem')
    const result = await DCLib.Account.getAccountFromServer('testKey')

    expect(localStorageStub.getCall(0).args).to.deep.equal(['testKey'])
    expect(result).to.equal('fakePrivateKey')
    expect(DCLib.Account._wallet.openkey).to.equal('fakeAddress')
    expect(localStorageSetItemStub.getCall(0).args).to.deep.equal(['testKey', 'wait'])
    expect(localStorageSetItemStub.getCall(1).args).to.deep.equal([
      'testKey',
      JSON.stringify({ address: 'fakeAddress', privateKey: 'fakePrivateKey' })
    ])
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

  // it('should return wallet information', () => {
  //   const walletSpy = sandbox.stub(DCLib.Account, '_wallet').value({ privateKey: 'xxx', a: 'a' })
  //   const wallet = DCLib.Account.get()
  //   walletSpy.restore()

  //   expect(wallet).to.deep.equal({ a: 'a' })
  // })

  // it('should sign by key', () => {
  //   const removeSpy = sandbox.stub(DCLib.Utils, 'remove0x').returns('remove0xValue')
  //   const walletSignSpy = sandbox.stub().returns('signValue')

  //   sandbox.stub(DCLib.Account, '_wallet').value({ sign: walletSignSpy })

  //   const sign = DCLib.Account.sign('value')

  //   expect(sign).to.equal('signValue')
  //   expect(removeSpy.getCall(0).args).to.deep.equal(['value'])
  //   expect(walletSignSpy.getCall(0).args).to.deep.equal(['remove0xValue'])
  // })

  it('should reset wallet', () => {
    const localStorageSpy = sandbox.stub(localStorage, 'setItem')

    DCLib.Account.reset()

    expect(localStorageSpy.getCall(0).args).to.deep.equal(['web3wallet', ''])
  })

  it('should send bets', async () => {
    const transferStub = sandbox.stub()
    const sendStub = sandbox.stub()
    const estimateGasStub = sandbox.stub().returns(Promise.resolve(0.01))
    const add0xStub = sandbox.stub(DCLib.Utils, 'add0x').returns('add0xValue')
    const bet2decStub = sandbox.stub(DCLib.Utils, 'bet2dec').returns(10.1)
    sandbox.stub(DCLib.Account, 'get').returns({ openkey: 'openKeyValue' })
    sandbox.stub(DCLib.Account, '_config').value({ gasPrice: true })
    sandbox.stub(DCLib.Account, '_ERC20').value({
      methods: {
        transfer (...args) {
          transferStub.returns(this)
          return transferStub(...args)
        },
        estimateGas: estimateGasStub,
        send (...args) {
          sendStub.returns(this)
          return sendStub(...args)
        },
        on (msg) { return msg === 'receipt' ? Promise.resolve(5) : this }
      }
    })
    const result = await DCLib.Account.sendBets('adress', 10)

    expect(result).to.equal(5)
    expect(add0xStub.getCall(0).args).to.deep.equal(['adress'])
    expect(bet2decStub.getCall(0).args).to.deep.equal([10])
    expect(estimateGasStub.getCall(0).args[0].from).to.equal('openKeyValue')
    expect(transferStub.getCall(0).args).to.deep.equal(['add0xValue', 10.1])
    expect(sendStub.getCall(0).args[0].from).to.equal('openKeyValue')
    expect(sendStub.getCall(0).args[0].gasPrice).to.equal(true)
    expect(await sendStub.getCall(0).args[0].gas).to.equal(0.01)
  })
})
