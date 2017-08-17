import * as Utils from './utils'

import ethWallet from 'eth-lightwallet'
import ethRPC    from './RPC'

let _wallet = {}
let _RPC    = {}
let _config = {}

export default class Account {
	constructor(config, callback) {
		_config = config
		_RPC    = new ethRPC( _config.rpc_url )

		this.lightWallet = ethWallet

		this.getPlatformWallet()

		if (localStorage.wallet) {
			try {
				_wallet = JSON.parse(localStorage.wallet)
			} catch(e) {
				this.autocreate(callback)
				return
			}
			callback()
			return
		}

		this.autocreate(callback)
	}

	getPlatformWallet(){
		if (!localStorage.keystore) {
			return
		}

		let ks = ethWallet.keystore.deserialize( localStorage.keystore )

		if (typeof ks.getAddresses !== 'function') {
			return
		}

		localStorage.wallet = JSON.stringify({
			password   : '1234',
			keystorage : localStorage.keystore,
			addr       : ks.getAddresses()[0],
			openkey    : '0x' + ks.getAddresses()[0],
			address    : Utils.pad( ks.getAddresses()[0], 64 )
		})
	}

	generateRandomSeed(){
		return ethWallet.keystore.generateRandomSeed()
	}

	autocreate(callback){
		if (typeof _config.create_account !== 'undefined' && _config.create_account==false) {
			callback(false)
			return
		}

		this.create({
			seedPhrase: this.generateRandomSeed(),
			password:   _config.wallet_pass
		}, callback)
	}

	create(params, callback){
		let wallet = {}

		ethWallet.keystore.createVault({
			seedPhrase: params.seedPhrase,
			password:   params.password
		}, (err, ks)=>{
			ks.keyFromPassword(params.password, (err, pwDerivedKey)=>{
				ks.generateNewAddress(pwDerivedKey, 1)
				wallet.password   = params.password
				wallet.keystorage = ks.serialize()
				wallet.addr       = ks.getAddresses()[0]
				wallet.openkey    = '0x' + ks.getAddresses()[0]
				wallet.address    = Utils.pad( ks.getAddresses()[0], 64 )

				localStorage.wallet = JSON.stringify(wallet)

				_wallet = wallet

				if (callback) { callback(wallet) }

				return
			})
		})
	}

	get(){
		return _wallet
	}

	getKs(){
		if (this.keyStore) {
			return this.keyStore
		}
		if (!_wallet || !_wallet.keystorage) {
			return false
		}

		this.keyStore = ethWallet.keystore.deserialize( _wallet.keystorage  )
		return this.keyStore
	}

	exportPrivateKey(callback){
		this.getPwDerivedKey( PwDerivedKey => {
			let private_key = this.getKs().exportPrivateKey(_wallet.addr, PwDerivedKey)

			callback(private_key)
		})
	}


	getPwDerivedKey(callback, limit=5){
		if (this.pwDerivedKey) {
			callback(this.pwDerivedKey)
			return
		}

		if (!this.getKs()) { return }

		this.getKs().keyFromPassword(_wallet.password, (err, pwDerivedKey)=>{
			if (err && limit>0 ) { this.getPwDerivedKey(callback, (limit-1)); return }

			if (pwDerivedKey) {
				this.pwDerivedKey = pwDerivedKey
			}
			callback(pwDerivedKey)
		})
	}

	reset(){
		localStorage.wallet = false
	}

	getNonce(callback){
		// if (this.nonce) {
		// 	this.nonce++
		// 	callback('0x'+Utils.numToHex(this.nonce))
		// 	return
		// }

		_RPC.request('eth_getTransactionCount', [ this.get().openkey, 'latest']).then( response => {
			this.nonce = Utils.hexToNum(response.result.substr(2))

			callback( response.result )
		})
	}

	getEthBalance(callback){
		let address = this.get().openkey
		_RPC.request('eth_getBalance', [address, 'latest']).then( response => {
			callback( Utils.hexToNum(response.result) / 1000000000000000000 )
		}).catch( err => {
			console.error(err)
		})
	}

	getBetsBalance(callback){
		let address = this.get().openkey
		let data = '0x' + Utils.hashName('balanceOf(address)')
				  		+ Utils.pad(Utils.numToHex(address.substr(2)), 64)


		_RPC.request('eth_call', [{
			'from': this.get().openkey,
			'to':   _config.erc20_address,
			'data': data
		}, 'latest']
		).then( response => {
			callback( Utils.hexToNum(response.result) / 100000000 )
		}).catch( err => {
			console.error(err)
		})
	}

	sendBets(to, amount, callback){
		// Create contract function transaction
		this.signedContractFuncTx(
			// contract with bets
			_config.erc20_address, _config.erc20_abi,

			// contract function and params
			'transfer', [to, (amount*100000000)],
			0,
			// result: signed transaction
			signedTx => {

				// send transacriont to RPC
				_RPC.request('eth_sendRawTransaction', ['0x'+signedTx], 0).then( response => {
					if (!response || !response.result) { return }
					callback( response.result )
				})
			}
		)
	}

	sendEth(to, amount, callback){
		amount = amount * 1000000000000000000

		this.signedEthTx(to, amount, signedEthTx=>{
			_RPC.request('eth_sendRawTransaction', ['0x'+signedEthTx], 0).then( response => {
				if (!response || !response.result) { return }
				callback( response.result )
			})

		})
	}


	signMsg(rawMsg, callback){
		this.getPwDerivedKey(pwDerivedKey=>{
			let VRS = ethWallet.signing.signMsg(
				this.getKs(),
				pwDerivedKey,
				rawMsg,
				this.get().openkey.substr(2)
			)

			const concat = ethWallet.signing.concatSig(VRS)
			callback( concat )
		})
	}
	signMsgHash(rawMsgHash, callback){
		this.getPwDerivedKey(pwDerivedKey=>{
			let VRS = ethWallet.signing.signMsgHash(
				this.getKs(),
				pwDerivedKey,
				rawMsgHash,
				this.get().openkey.substr(2)
			)

			const concat = ethWallet.signing.concatSig(VRS)
			callback( concat )
		})
	}

	checkSIG(rawMsg, signature, author_address){
		let v = Utils.hexToNum(signature.slice(130, 132)) // 27 or 28
		let r = signature.slice(0, 66)
		let s = '0x' + signature.slice(66, 130)

		let msg_openkey = false

		try {
			msg_openkey = Utils.buf2bytes32( ethWallet.signing.recoverAddress(rawMsg, v, r, s) )
		} catch(e) {
			console.error('recoverAddress err:',e)
			return false
		}

		let ok = (msg_openkey==author_address)

		if (!ok) {
			console.error('invalid sig', msg_openkey+'!=='+author_address)
		};

		return ok
	}



	//  Make and Sing contract function transaction
	signedContractFuncTx(contract_address, contract_abi, function_name, function_args, value=0, callback){
		this.getNonce( nonce => {

			let options = {
				to:       contract_address,
				nonce:    nonce,
				// gasPrice: '0x737be7600',
				gasPrice: '0x'+Utils.numToHex(_config.gasPrice),
				gasLimit: '0x'+Utils.numToHex(_config.gasLimit),
				value:    value,
			}

			//  Make contract function transaction
			// https://github.com/ConsenSys/eth-lightwallet#txutilsfunctiontxabi-functionname-args-txobject
			let registerTx = ethWallet.txutils.functionTx(
								contract_abi,
								function_name,
								function_args,
								options
							)


			//  Sign transaction
			this.signTx(registerTx, callback)
		})
	}

	// Make and Sing eth send transaction
	signedEthTx(to_address, value, callback){
		this.getNonce( nonce => {

			// https://github.com/ConsenSys/eth-lightwallet#txutilsvaluetxtxobject
			let options = {
				from:     this.get().openkey,
				to:       to_address,
				value:    value,
				nonce:    nonce,
				gasPrice: '0x'+Utils.numToHex(_config.gasPrice),
				gasLimit: '0x'+Utils.numToHex(_config.gasLimit),
			}

			// Make transaction
			let registerTx = ethWallet.txutils.valueTx(options)

			//  Sign transaction
			this.signTx(registerTx, callback)
		})
	}

	// Sing transaction
	// https://github.com/ConsenSys/eth-lightwallet#signingsigntxkeystore-pwderivedkey-rawtx-signingaddress-hdpathstring
	signTx(registerTx, callback){
		this.getPwDerivedKey( PwDerivedKey => {

			let signedTx = ethWallet.signing.signTx(
								this.getKs(),
								PwDerivedKey,
								registerTx,
								this.get().openkey.substr(2)
							)

			callback(signedTx)
		})
	}
}
