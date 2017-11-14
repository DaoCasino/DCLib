const assert = chai.assert


function Tests() {

	describe('Account', () => {

		describe('DCLib.Account.unlockAccount(password=false)', () => {

			it('Unlock account with password', function () {
				this.timeout(3000)
				const unlock = DCLib.Account.unlockAccount('1234')
				console.groupCollapsed('Account info from unlock with password')
				console.table(unlock)
				console.groupEnd()
			})

			it('Unlock account without password', function () {
				this.timeout(3000)
				const unlock = DCLib.Account.unlockAccount()
				console.groupCollapsed('Account info from unlock without password')
				console.table(unlock)
				console.groupEnd()
			})

		})

		describe('DCLib.Account.exportPrivateKey(password=false)', () => {

			it('Export private key with password', function () {
				this.timeout(3000)
				const exportPrivateKey = DCLib.Account.exportPrivateKey('1234')
				console.log('Private key with pass: ', exportPrivateKey)
			})

			it('Export private key without password', function () {
				this.timeout(3000)
				const exportPrivateKey = DCLib.Account.exportPrivateKey()
				console.log('Private key without pass: ', exportPrivateKey)
			})

		})

		describe('DCLib.Account.get()', function () {

			it('Getting account information', function () {
				this.timeout(3000)
				const get = DCLib.Account.get()
				console.groupCollapsed('Account info from get function')
				console.table(get)
				console.groupEnd()
			})

		})

		describe('DCLib.Account.sign(raw)', () => {

			it('Sign message', function () {
				this.timeout(3000)
				const sign = DCLib.Account.sign('Hello world')
				console.groupCollapsed('Sign message info')
				console.table(sign)
				console.groupEnd()
			})

		})

		describe('DCLIB.Account.signHash(hash)', () => {

			it('Sign Hash string', function () {
				this.timeout(3000)
				const signHash = DCLib.Account.signHash('0xA9312KJD')
				console.log('Sign hash info: ', signHash)
			})

		})

		describe('DCLib.Account.sendBets(to, amound)', () => {
			it('Send bets to address', function () {
				this.timeout(3000)
				const address = JSON.parse(localStorage.web3wallet).address
				DCLib.Account.sendBets(address, 0, receipt => {
					console.groupCollapsed('Transaction info')
					console.table(receipt)
					console.groupEnd()
				})
			})
		})

		describe('DCLib.Account.reset()', () => {

			it('Reset account on localStorage', function () {
				this.timeout(8000)
				setTimeout(
					function () {
						DCLib.Account.reset(),
							console.log('web3Wallet reseting')
					}, 7000)
			})

		})

	})

}

async function AddTokens() {

	const opnKey = JSON.parse(localStorage.web3wallet).address
	DCLib.faucet(opnKey)
	
	const test = await Tests()

}

AddTokens()