const web3     = DCLib.Account.web3
const web3Acc  = web3.eth.accounts
const web3Met  = web3.eth.methods
const assert   = chai.assert
let   rawTrans = ''
let   data     = ''	

function localStorageAdd(openKey, privateKey, hash, signature) {
	let data = {
		openKey    : openKey,
		privateKey : privateKey,
		hash       : hash,
		signature  : signature
	}

	localStorage.web3wallet = JSON.stringify(data)	
}


function create(params) {
	if (localStorage.web3wallet) {
		try {
			let data    = JSON.parse(localStorage.web3wallet)
			let recover = web3Acc.recover(data.hash, data.signature)
			console.log('Recover account for localStorage: ', recover)
		} catch(e) {
			console.error('Recover error: ', e)
		}
	} else {
		let newAcc  = {}

		params.entropy 
			? newAcc = web3Acc.create(params.entropy) 
			: newAcc = web3Acc.create()

		const encryptKey = web3Acc.encrypt(newAcc.privateKey, params.userPass)
		const sign       = web3Acc.sign(params.userPass, newAcc.privateKey)
		
		localStorageAdd(newAcc.address, encryptKey, sign.messageHash, sign.signature)		
	}
}

function restoreAccount(privateKey, userPass) {
	if (privateKey && userPass) {
		try {
			const restoreAcc = web3Acc.privateKeyToAccount(privateKey)
			const encryptKey = web3Acc.encrypt(privateKey, userPass)
			const sign 		 = web3Acc.sign('12345678', privateKey)

			localStorageAdd(restoreAcc.address, encryptKey, sign.messageHash, sign.signature)
		} catch(e) {
			console.log('Error: ', e)
		}
	} else {
		console.log('Error not privateKey')
	}
}

function createERC20 () {
	const erc20config = {
		address:'0x95a48dca999c89e4e284930d9b9af973a7481287',
		abi:JSON.parse('[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"standard","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]')
	}

	window.ERC20 = new DCLib.web3.eth.Contract(
		erc20config.abi, 
		erc20config.address
	)
}

function getBetsBalance () {
	web3.eth.getBalance('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59')
	.then(value => {
		console.log('Bets balance: ', value)
	})	
}

function getEthBalance() {
	web3.eth.getBalance('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59')
	.then(value => {
		console.log('Eth balance: ', value / 1000000000000000000)
	})
}

function sign (mess, privateKey, userPass) {

	const decryptKey = web3Acc.decrypt(privateKey, userPass)

	try {
		const sign = web3Acc.sign(mess, decryptKey.privateKey)
		data = {
			hash	  : sign.messageHash,
			signature : sign.signature
		}
		console.table(data)
	} catch (e) {
		console.error('Error: ', e)
	}

}

function recover (recoverParam) {
	try {
		const recover = web3Acc.recover(recoverParam.hash, recoverParam.signature)
		console.log('Recover address: ', recover)
	} catch (e) {
		console.log('Error: ', e)
	}
}

function signTransaction (address_to, userPass, value_bets, gas, privateKey, nonce, chainId) {

	const decryptKey = web3Acc.decrypt(privateKey, userPass)
	
	try {
		web3Acc.signTransaction({
			to      : address_to,
			value   : value_bets,
			gas     : gas,
			nonce   : nonce,
			chainId : chainId
		}, decryptKey.privateKey)
		.then(value => {
			rawTrans = value.rawTransaction
			console.log('Sign transactions data: ', rawTrans)
		})
	} catch (e) {
		console.log(e)
	}

}

function recoverTransaction (raw) {
	try {
		const recoverTrans = web3Acc.recoverTransaction(raw)
		console.log('Recover transaction: ', recoverTrans)
	} catch (e) {
		console.log('Error: ', e)
	}
}

describe('Account', () => {
	it('Check localStorage', () => {
		let web3wallet = JSON.parse(localStorage.web3wallet || 'false')

		if(typeof web3wallet === 'object'){	
			assert(true)
		}
	})

	it('Checing and create account', () => {
		create({
			entropy: web3.utils.randomHex(32),
			userPass: '1234'
		})
	})

	it('restore Account', function () {
		this.timeout(5000)
		restoreAccount('0x98cbbfbcc3d7114582b3c93f30bd8e71027b6aa726f79aabb48c84289d86a3ec', '1234')
	})

	it('Sign', function () {
		this.timeout(5000)
		const data = JSON.parse(localStorage.web3wallet)
		sign('Hello app', data.privateKey, '1234')
	})

	it('Recover', () => {
		recover(data)
	})

})

describe('Balance', () => {

	it('get Bets balance', () => {
		getBetsBalance()
	})

	it('get Eth balance', () => {
		getEthBalance()
	})

})

describe('Contract and transactions', () => {

	it('create', () => {
		createERC20()
	})

	it('Sign transaction', function () {
		this.timeout(5000)
		const data = JSON.parse(localStorage.web3wallet)
		signTransaction('0x95a48dca999c89e4e284930d9b9af973a7481287', '1234', '1000000', 200000, data.privateKey, 0, 1)
	})
	

	it('Recover transaction', function () {
		setTimeout(function() {
			recoverTransaction(rawTrans)
		}, 1000)
	})
})