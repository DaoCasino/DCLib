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



	// describe('WEB3', function() {
		
	// 	it('New contract instance', ()=>{

	// 		const test_contract = {
	// 			address:'0x95a48dca999c89e4e284930d9b9af973a7481287',
	// 			abi:JSON.parse('[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"standard","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]')
	// 		}

	// 		window.myContract = new DCLib.web3.eth.Contract(
	// 			test_contract.abi, 
	// 			test_contract.address
	// 		)

	// 	})
		
	// 	it('Call contract function', ()=>{
	// 		myContract.methods.balanceOf(['0xb7c3e309eb20fa192d28a267776535ce1fdaa262']).call()
	// 	})
	// })

	

  

	// describe('Check .Utils functions',  () => {
	// 	it('soliditySHA3 from web3 utils', () => {
	// 		assert( DCLib.Utils.sha3('allowance(address,address)') == '0xdd62ed3e90e97b3d417db9c0c7522647811bafca5afc6694f143588d255fdfb4' )
	// 	})
	// })

	// describe('Check lib higth-level functions',  () => {
		
	// 	it('.randomHash() exist', () => {
	// 		assert((typeof DCLib.randomHash === 'function'))
	// 	})
		
	// 	describe('.randomNum()',  () => {

	// 		const hash = '919dcd724983da415a3f3875195a3c0e7ddfd5ac61c33add4d1f01f1ebd964035948680567cbf5284e58c0977033058bc1e3796c7758f41a4ddffa27e5fd5f7e1c'
			
	// 		it('case 1', function(){	
	// 			let rand = DCLib.randomNum(hash, -9, 11)
	// 			console.log('rnd case 1', rand)
	// 			assert( (rand>=-9 && rand<=11)  )
	// 		})

	// 		it('case 2', function(){	
	// 			let rand = DCLib.randomNum(hash, 100, -100)
	// 			console.log('rnd case 2', rand)
	// 			assert( (rand>=-100 && rand<=100) )
	// 		})
			
	// 		it('case 3', function(){	
	// 			let rand = DCLib.randomNum(hash, 999, 999)
	// 			console.log('rnd case 3', rand)
	// 			assert( (rand>=999 && rand<=999) )
	// 		})

	// 		it('case 4', function(){	
	// 			let rand = DCLib.randomNum(hash, 0, 0)
	// 			console.log('rnd case 4', rand)
	// 			assert( (rand>=0 && rand<=0) )
	// 		})

	// 		it('case 5', function(){	
	// 			let rand = DCLib.randomNum(hash, 1, 10)
	// 			console.log('rnd case 4', rand)
	// 			assert( (rand>=1 && rand<=10) )
	// 		})
	// 	})
	// })




	// describe('Account',  () => {
    
	// 	describe('Info', () => {
	// 		it('Account info', () => {
	// 			DCLib.Account.info(res => {
	// 				console.groupCollapsed('function %cinfo', 'background: orange; color: black;')
	// 				console.table(res)
	// 				console.groupEnd()
	// 			})
	// 		})
	      
	// 		it('Account Info openkey', () => {
	// 			DCLib.Account.info(res => {
	// 				assert((!!res.openkey))
	// 				console.log('%copenkey:%c' + res.openkey + ' ', 'color:#333; background:#ccc;', 'background: orange; color: black;')
	// 			})
	// 		})
	      
	// 		it('Account info has balance', () => {
	// 			DCLib.Account.info(info => {
	// 				assert((typeof info.balance === 'object'))
	// 				console.table(info.balance)
	// 			})
	// 		})

	// 		it('balance has .eth', () => {
	// 			DCLib.Account.info(info => {
	// 				if (info.balance.eth === 0) {
	// 					assert( (!info.balance.eth), 'eth balance' )
	// 					console.log(info.balance.eth)  
	// 				} else {
	// 					assert( (!!info.balance.eth), 'eth balance' )
	// 					console.log(info.balance.eth)  
	// 				}
	// 			})
	// 		})

	// 		it('balance has .bet', () => {
	// 			DCLib.Account.info(info => {
	// 				if (info.balance.bet === 0) {
	// 					assert( (!info.balance.bet), 'bet balance' )
	// 					console.log(info.balance.bet)  
	// 				} else {
	// 					assert( (!!info.balance.bet), 'bet balance' )
	// 					console.log(info.balance.bet)  
	// 				}
	// 			})
	// 		})

	// 		it('Account .get().openkey exist', () => {
	// 			assert( DCLib.Account.get().openkey )
	// 		})

	// 	})

	// 	describe('Other Functions', () => {

	// 		it('exportPrivateKey', function() {

	// 			this.timeout(10000)

	// 			// DCLib.Account.exportPrivateKey('1234')

	// 			DCLib.Account.exportPrivateKey('1234', exportPrivateKey => {

	// 				const privateData = {
	// 					name: 'Private key',
	// 					value: exportPrivateKey.privateKey
	// 				}
	// 				console.groupCollapsed('Function %cexportPrivateKey', 'background: orange; color: black;')
	// 				console.table(privateData)
	// 				console.groupEnd()

	// 			})

	// 		})

	// 		it('reset', () => {
	// 			DCLib.Account.reset()
	// 		})

	// 	})
	// })



// 	describe('Dapp', function() {
    
// 		describe('Create new instance - new DCLib.DApp()', function() { 
            
// 			it('DApp Create', () => {
// 				// Create our DApp
// 				window.MyDApp = new DCLib.DApp({
// 					code  : 'dicegame_v2' , // unique DApp code
// 					logic : GameLogic     , // inject logic constructor in your DApp
// 				})
// 			}) 
      
// 			it ('DApp logic hash exist', () => {  
// 				assert( (!!MyDApp.hash) )
// 				console.log(MyDApp.hash)
// 			})
      
// 		})

// 		describe('Connection', () => {
            
// 			it('DApp connect()', () => {
// 				MyDApp.connect({ bankroller : 'auto'},
// 					function(result) {
// 						console.log(result)
// 					}
// 				)
// 			})
// 			it('DApp has .call()', () => {
// 				assert((typeof MyDApp.call === 'function'))
// 			})
		
// 			it('DApp has .disconnect()', () => {
// 				assert((typeof MyDApp.disconnect === 'function'))
// 			})
    
// 		})
// 	})
// })





// describe('Dapp', function() {

// 	describe('Create', function() { 
		
// 		it('DApp Create', () => {
// 			// Create our DApp
// 			window.MyDApp = new DCLib.DApp({
// 				code  : 'dicegame_v2' , // unique DApp code
// 				logic : GameLogic     , // inject logic constructor in your DApp
// 			})
// 		}) 
	
// 		it ('logic hash exist', () => {  
// 			assert( (!!MyDApp.hash) )
// 			console.log(MyDApp.hash)
// 		})
	
// 	})

// 	describe('Connection', () => {
		
// 		it('DApp connection', () => {
// 			MyDApp.connect({ bankroller : 'auto'},
// 				function(result) {
// 					console.log(result)
// 				}
// 			)
// 		})

// 	})

 })




