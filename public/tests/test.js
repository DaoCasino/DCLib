const assert = chai.assert

describe('DCLib', () => {


	it('DCLib.on(event, callback)', () => {
	
		DCLib.on('_ready', () => {
			console.log(5)
		})
	
	})

	it('Random hash: DCLib.randomHash()', () => {
	
		const randomHash = DCLib.randomHash()
		console.log('Random hash: ', randomHash)
	
	})

	it('Sign check', function () {

		this.timeout(20000)
	
		console.groupCollapsed('Sign check')
	
			for (let i = 0; i < 3; i++) {
				let str = 'Success'
				let s = DCLib.Utils.makeSeed()
				if (i === 2) {
					s = '0xA312h31kj4h4l1hk34j123313j123141r1d1c2l3kl12'
					str = 'Failed'
				}
				const checkSig = DCLib.checkSig(s, DCLib.Account.signHash(s), DCLib.Account.get().openkey)
				console.log(str, checkSig)
			}
		
		console.groupEnd()

	})

	it('Check hash sign', function () {

		this.timeout(20000)
	
		console.groupCollapsed('Check hash sign')
	
			for (let i = 0; i < 3; i++) {
				let str = 'Succes!'
				let s = DCLib.Utils.makeSeed()
				if (i === 2) {
					s = 'j312h31kj4h4l1hk34j123313j123141r1d1c2l3kl12'
					str = 'Failed!'
				}
				const checkHashSign = DCLib.checkHashSig(s, DCLib.Account.signHash(s), DCLib.Account.get().openkey)
				console.log(str, checkHashSign)
			}
		
		console.groupEnd()

	})

	it('Sig Hash Recover', function () {
	
		this.timeout(10000)
		const s = DCLib.Utils.makeSeed()
		const sigHashRecover = DCLib.sigHashRecover(s, DCLib.Account.signHash(s))
		console.log('Sig hash recover: ',sigHashRecover)
	
	})

	it('Sig recover', function () {
	
		this.timeout(10000)
		const s = DCLib.Utils.makeSeed()
		const sigRecover = DCLib.sigRecover(s, DCLib.Account.signHash(s))
		console.log('Sig recover: ', sigRecover)
	
	})

	it('Faucet', function () {
	
		const faucet = DCLib.faucet(DCLib.Account.get().openkey)
		console.log(faucet)
	
	})

	it('Random hash', function () {

		const randomHash = DCLib.randomHash()
		console.log(randomHash)
	
	})

	it('Number from hash', function () {

		console.groupCollapsed('numFromHash')
			for (let i = 0; i < 5; i++) {
				const randomHash = DCLib.randomHash()
				let min = Math.floor(Math.random(100) * 100)
				const max = Math.floor(Math.random(1000) * 1000)
				if (i % 2 === 0) {
					min = 0 - min
				}
				const numFromHash = DCLib.numFromHash(randomHash.slice(8, -1), min, max)
				console.log(`
				Max value: ${max},
				Min value: ${min}
				Random num: ${numFromHash}`)
			}
		console.groupEnd()

	})

	it('Define DApp logic', () => {

		DCLib.defineDAppLogic('myGame_v1', function () {
			console.log('Game started')
		})

		window.MyDapp = new DCLib.DApp({
			code: 'myGame_v1'
		})

	})

 })




