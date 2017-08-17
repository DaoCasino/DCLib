import * as Utils from './utils'

import ABI     from 'ethereumjs-abi'
import _config from './config.js'
import Account from './Account.js'
import ethRPC  from './RPC'
import Channel from './Channel'
import Api     from './Api'
import bigInt  from 'big-integer'

import RTC  from './rtc'

const WEB3 = require('web3')


const approve_deposit = 1000

let _channels = {}
let _subscribes = {}
let _active_bankrollers = {}

export default class DaoCasino {
	constructor(params) {
		// this.web3 = _web3
		params = params || {}

		this.Init(params)

		return this
	}

	Init(params, callback){
		this.params = params

		for(let k in params){
			_config[k] = params[k]
		}

		this.ABI    = ABI
		this.web3   = new WEB3()

		this.bigInt = bigInt
		this.Utils  = Utils

		this.Api    = new Api( _config )
		this.RPC    = new ethRPC( _config.rpc_url )

		if (params.create_account===false) {
			try {
				this.RTC_main = new RTC()
			} catch(e) {
			}
			return
		}

		this.Account = new Account( _config, ()=>{
			setTimeout(()=>{
				if(callback) callback(this.Account.get())

				if (typeof localStorage.requestBets=== 'undefined') {
					localStorage.requestBets = true
					this.Api.addBets( this.Account.get().openkey )
				}
				if (_subscribes['Account']) {
					_subscribes['Account']({
						address: this.Account.get().openkey,
						balance: { bets:0, eth:0 }
					})
				}

				const user_id = this.Account.get().openkey || false
				this.RTC_main = new RTC(user_id)

				this.updateBalance()
			}, 1000)
		})

		this.updateBankrollers()
	}

	subscribe(data, callback){
		_subscribes[data] = callback
	}

	unsubscribe(data){
		delete(_subscribes[data])
	}

	updateBalance(){
		setTimeout(()=>{ this.updateBalance() }, 10000 )

		if (!_subscribes.Account){
			return
		}

		this.Account.getBetsBalance(bets=>{ this.Account.getEthBalance(eth=>{
			_subscribes.Account({
				address: this.Account.get().openkey,
				balance: { bets:bets, eth:eth }
			})
		}) })
	}

	updateBankrollers(){
		setTimeout(()=>{ this.updateBankrollers() }, 3000 )

		for(let k in _active_bankrollers){
			if ((_active_bankrollers[k].last_upd - (new Date().getTime())) < -5000) {
				delete(_active_bankrollers[k])
			}
		}

		if (_subscribes.Bankrollers){
			this.Api.getBankrollers().then( list =>{
				for(let k in list){
					let addr = list[k].toLowerCase()

					let game_code = ''
					if (_active_bankrollers[addr] && _active_bankrollers[addr].game_code) {
						game_code = _active_bankrollers[addr].game_code
					};
					_active_bankrollers[addr] = {
						last_upd:  new Date().getTime()*1,
						address:   addr,
						game_code: game_code
					}
				}
			} )

			_subscribes.Bankrollers( _active_bankrollers )
		}

		if (this.mesh_bankrollers_subscribe || !this.RTC_main) {
			return
		}

		this.mesh_bankrollers_subscribe = true

		this.RTC_main.subscribe('all', data => {
			if (data && data.action && data.action=='bankroller_active') {
				// this.RTC_main.send({
				// 	action    : 'you_are_ready',
				// 	game_code : data.game_code,
				// 	address   : data.address,
				// }, delivered => {
				// 	if (!delivered) {
				// 		if (_active_bankrollers[data.address]) {
				// 			delete(_active_bankrollers[data.address])
				// 		}
				// 		return
				// 	}

				_active_bankrollers[data.address] = {
					last_upd  : new Date().getTime(),
					address   : data.address,
					game_code : data.game_code,
					stat      : data.stat,
				}
				// })
			}
		})
	}

	getBankrollers(game_code=false){
		if (!game_code) {
			return _active_bankrollers
		}

		let game_bankrollers = {}

		for(let k in _active_bankrollers){
			if (_active_bankrollers[k] && _active_bankrollers[k].game_code == game_code) {
				game_bankrollers[k] = Object.assign({}, _active_bankrollers[k])
			}
		}

		return game_bankrollers
	}


	// Проверяем разрешил ли игрок списывать бэты контракту
	setGameContract(address, callback){
		this.getAllowance(address, allowance_bets =>{
			if (allowance_bets < 1000000) {
				this.approveContract(address, 100000000000, ()=>{
					this.setGameContract(address, callback)
					return
				})
				return
			}

			// all ok
			callback()
		})
	}


	// Проверяем сколько денег разрешено списывать контракту игры
	getAllowance(address, callback){
		this.RPC.request('eth_call', [{
			'from': this.Account.get().openkey,
			'to':   _config.erc20_address,
			'data': '0x'+Utils.hashName('allowance(address,address)') + Utils.pad(this.Account.get().openkey.substr(2), 64) + Utils.pad(address.substr(2), 64)
		}, 'latest']).then( response => {
			callback(Utils.hexToNum(response.result))
		})
	}

	// Разрешаем контракту игры списывать с нас бэты
	approveContract(address, max_bets, callback, repeat=3){
		console.log('approveContract', address, max_bets)
		this.transactContractFunction(
			_config.erc20_address, _config.erc20_abi,

			'approve', [address, max_bets*100000000],

			0,

			response => {
				console.info(response)

				if (!response || !response.result) {
					setTimeout(()=>{
						console.log('repeat approveContract')
						repeat--
						if (repeat < 1) {
							callback({error:'Cant_approve_contract'})
							return
						}
						this.approveContract(address, max_bets, callback, repeat)
					}, 3000)
					return
				}

				const checkResult = ()=>{ setTimeout( ()=>{
					this.getAllowance(address, res => {
						console.log('checkResult res', res)
						if (res >= max_bets*100000000) {
							callback( res )
							return
						}
						checkResult()
					})
				}, 2000) }

				checkResult()
			}
		)
	}



	transactContractFunction(address, abi, func_name, func_params, value=0, callback){
		this.Account.signedContractFuncTx(
			address, abi, func_name, func_params, value,
			signedTx => {
				this.RPC.request('eth_sendRawTransaction', ['0x' + signedTx]).then( callback )
			}
		)
	}

	runContractFunction(params, callbacks, repeat_cnt=24){
		let watchResult = TxHash => {
			this.RPC.request('eth_getTransactionReceipt', [TxHash]).then(response=>{
				if (!response || !response.result) {
					setTimeout(()=>{ watchResult(TxHash) }, 5000)
					return
				}

				if (callbacks.onSuccess) callbacks.onSuccess( response.result )

				return
			})
		}

		let value = 0
		this.transactContractFunction(params.address, params.abi, params.method.name, params.method.args, value, response =>{
			if (!response.result) {
				console.log('TxFail: repeat after 5 seconds')

				if (callbacks.onTxFail) callbacks.onTxFail( response )

				repeat_cnt--
				setTimeout(()=>{
					this.runContractFunction(params, callbacks, repeat_cnt)
				}, 5000)

				return
			}

			if (callbacks.onTxProcess) callbacks.onTxProcess( response.result )

			watchResult(response.result)
		})
	}




	/*
	 * Works with channels
	 */
	// Open channel
	startGame(game_code, contract_address, deposit, callback) { setTimeout(()=>{
		contract_address = contract_address.toLowerCase()

		this.game_code = game_code

		const user_id = this.Account.get().openkey || false

		console.log('setBankroller', contract_address)
		this.setBankroller(contract_address, bankroller_address=>{
			console.log('bankroller_address', bankroller_address)

			if (!bankroller_address || !this.bankrollerExist(bankroller_address)) {
				callback({error:'bankroller_offline'})
				return
			}

			contract_address = bankroller_address

			if (this.gameStarted(game_code, contract_address)) {
				callback({error:'game_allready_started', status:this.game_status})
				return
			}

			this.game_status      = 'starting'
			this.game_hash        = Utils.makeSeed()
			this.contract_address = contract_address

			this.RTC_game = new RTC(user_id, this.contract_address)

			localStorage.game_code        = game_code
			localStorage.contract_address = contract_address

			// Create channel if not exist
			if (!_channels[contract_address]) {
				let channel_id = localStorage.channel_id || false

				_channels[contract_address] = new Channel(contract_address, channel_id, this.Account, this.RPC)

				localStorage.channel_id = _channels[contract_address].channel_id
			}

			const channellOpened = result => {
				this.game_status = 'channel_opened'


				if (result && result.error) {
					callback(result)
					return
				}

				localStorage[ _channels[contract_address].channel_id ] = true
				console.log('result',result, this.RTC_game)
				if (result && this.RTC_game) {
					console.log('open_game_channel')
					this.RTC_game.send({
						action:     'open_game_channel',
						game_code:  game_code,
						game_hash:  this.game_hash,
						channel_id: _channels[contract_address].channel_id,
						deposit:    deposit,
						address:    contract_address,
						seed:       Utils.makeSeed(),
					}, delivered => {
						console.log('delivered', delivered)
						callback( result )
					})
				}
			}

			this.getAllowance(contract_address, res => {
				if (deposit <= res) {
					this.game_status = 'approve'
					// open channel in game contract
					_channels[contract_address].open(deposit, channellOpened)
					return
				}

				// Check user balance
				this.Account.getEthBalance( eth => {
					if ( eth < 0.01 ) {
						console.error('You need minimum 0.01  ETH on wallet.')
						console.error('But you have only '+eth+' ETH')
						callback({error:'no_eth'})
						return
					}

					this.Account.getBetsBalance( bets => {
						if (bets*100000000 < deposit ) {
							console.error('You need minimum '+(deposit/100000000).toFixed(2)+' BET(for game deposit) on balance.')
							console.error('But you have only '+(bets/100000000).toFixed(2)+' BET')
							callback({error:'no_bets'})
							return
						}

						// Approve this game contaract in ERC20
						this.approveContract(contract_address, approve_deposit, (r)=>{
							this.game_status = 'approve'

							// open channel in game contract
							_channels[contract_address].open(deposit, channellOpened)
						})

					})
				})

			})
		})
	}, 2000) }

	getRandomBankroller(){
		console.log( 'this.game_code', this.game_code )
		console.log(Casino.getBankrollers(this.game_code))

		let addresses = Object.keys(Casino.getBankrollers(this.game_code))
		if (!addresses.length) {
			return '0x'
		}
		return addresses[Math.floor(Math.random()*addresses.length)]
	}

	setBankroller(address, callback, repeat=5){
		let contract_address = address.toLowerCase()
		if (address=='auto') {
			contract_address = this.getRandomBankroller().toLowerCase()

			if (localStorage.contract_address && this.bankrollerExist(localStorage.contract_address)) {
				contract_address = localStorage.contract_address.toLowerCase()
			}
		}

		if (!this.bankrollerExist(contract_address)) {
			repeat--
			if (repeat < 0) {
				callback(false)
				return
			}

			setTimeout(()=>{
				this.setBankroller(address, callback, repeat)
			}, 1500)

			return
		}

		localStorage.contract_address = contract_address.toLowerCase()
		callback(contract_address.toLowerCase())
	}

	gameStarted(game_code, contract_address){
		return (this.contract_address && this.contract_address==contract_address )
	}

	bankrollerExist(contract_address){
		return !(!_active_bankrollers[contract_address.toLowerCase()])
	}

	restoreGame(callback=false){ setTimeout(()=>{
		const game_code        = localStorage.game_code
		const contract_address = localStorage.contract_address
		const channel_id       = localStorage.channel_id
		const user_id          = this.Account.get().openkey || false

		this.RTC_game = new RTC(user_id, contract_address)

		console.log('setBankroller', contract_address)
		this.setBankroller(contract_address, bankroller_address=>{
			if (contract_address != bankroller_address) {
				if(callback) callback({error:'bankroller_offline'})
				return
			}

			if (this.gameStarted(game_code, contract_address)) {
				if(callback) callback({error:'game_allready_started', status:this.game_status})
				return
			}

			this.game_code        = game_code
			this.contract_address = contract_address
			this.game_status      = 'channel_opened'

			_channels[contract_address] = new Channel(contract_address, channel_id, this.Account, this.RPC)

			if(callback) callback(true)
		})
	}, 2000) }

	getChannels() {
		return _channels
	}

	// Close channel
	endGame(profit, callback){
		let game_code        = this.game_code
		let contract_address = this.contract_address

		let seed = Utils.makeSeed()
		let listenRes = data => {
			if (data && data.result && data.seed == seed && data.action == 'game_channel_closed') {
				this.RTC_game.unsubscribe(contract_address, listenRes)

				if (data.result===true) {
					delete( localStorage[ _channels[contract_address].channel_id ] )
					delete( _channels[contract_address] )

					this.game_status      = 'ended'
					this.contract_address = false
					this.game_code        = false
				}

				callback(data.result)
			}
		}

		try {
			this.RTC_game.subscribe(contract_address, listenRes)

			this.RTC_game.send({
				action:     'close_game_channel',
				channel_id: _channels[contract_address].channel_id,
				game_code:  game_code,
				profit:     profit,
				account:    this.Account.get().openkey,
				address:    contract_address,
				seed:       seed,
			}, delivered => {

			})
		} catch(e) {
			console.error(e)
		}
	}




	DEMO_getRandomNumber(options, callbacks){
		let contract_address = '0xd7ddb57b9e061d25c943dc5bc934829bf369a0d3'
		let contract_abi     = [{'constant':true,'inputs':[{'name':'','type':'bytes32'}],'name':'randomNum','outputs':[{'name':'','type':'uint256'}],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'hash','type':'bytes32'},{'name':'min','type':'uint256'},{'name':'max','type':'uint256'}],'name':'Request','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'hash','type':'bytes32'},{'name':'sign','type':'bytes32'}],'name':'Generate','outputs':[{'name':'','type':'uint256'}],'payable':false,'type':'function'},{'constant':true,'inputs':[{'name':'','type':'bytes32'}],'name':'random','outputs':[{'name':'min','type':'uint256'},{'name':'max','type':'uint256'},{'name':'rnd','type':'uint256'},{'name':'gen','type':'bool'}],'payable':false,'type':'function'},{'anonymous':false,'inputs':[{'indexed':false,'name':'','type':'bytes32'}],'name':'log','type':'event'}]

		let min  = options.min || 0
		let max  = options.max || 100

		let _seed = Utils.makeSeed()
		let _vrs  = Utils.makeSeed()


		let randomVM = (seed, vrs)=>{
			return bigInt( vrs.substr(2), 16).divmod(max).remainder.value + min
		}

		let requestRandom = (seed, min=0, max=100, callback)=>{
			this.runContractFunction({
				address : contract_address,
				abi     : contract_abi,

				method:{
					name: 'Request',
					args: [seed, min, max],
				},
			},{
				onTxProcess:(tx)=>{
					callbacks.fromVM( randomVM(_seed, _vrs) )
				},
				onSuccess:(res)=>{
					callback(res)
				}
			})
		}


		let confirmRandom = (seed, vrs, callback) => {
			this.runContractFunction({
				address : contract_address,
				abi     : contract_abi,

				method:{
					name: 'Generate',
					args: [seed,  vrs],
				},
			},{
				onTxProcess:(tx)=>{

				},

				onSuccess:(res)=>{
					callback(res)
				}
			})
		}

		let getRandom = (seed, callback)=>{
			this.RPC.request('eth_call', [{
				'from' : this.Account.get().openkey,
				'to'   : contract_address,
				'data' : '0x' + Utils.hashName('randomNum(bytes32)') + seed.substr(2)
			}, 'latest']).then( response => {

				callback( Utils.hexToNum(response.result) )
			})
		}

		requestRandom(_seed, min, max, res=>{
			confirmRandom(_seed, _vrs, res=>{
				getRandom(_seed, callbacks.fromBlockchain)
			})
		})
	}

	onGameStateChange(callback){
		this.RTC_game.subscribe(this.contract_address, data=>{
			if (data.user_id==this.user_id) return
			if (['bankroller_active','you_are_ready', 'delivery_confirmation'].indexOf(data.action) > -1 ) { return }

			callback(data)
		})
	}

	sendGameFunction(func_name, args, delivered_callback){
		if (!this.RTC_game) {
			return
		}

		this.RTC_game.send({
			action:    'callFunction',
			game_code: this.game_code,
			address:   this.contract_address,
			game_id:   this.game_id,
			name:      func_name,
			args:      args,
		}, delivered => {
			if (delivered && delivered_callback) delivered_callback()
		})
	}

	callGameFunction(game_id, seed, func_name, args, callback){
		if (!this.RTC_game) {
			return
		}

		let game_hash        = this.game_hash
		let game_code        = this.game_code
		let contract_address = this.contract_address

		console.log('game_code',game_code)

		let subscribe_name = false

		let listenRes = data => {
			if (data && data.result && data.seed == seed) {
				callback(data)
				this.RTC_game.unsubscribe(contract_address, listenRand, subscribe_name)
			}
		}

		try {
			subscribe_name = this.RTC_game.subscribe(contract_address, listenRes)

			this.RTC_game.send({
				action:    'call_game_function',
				game_code: game_code,
				game_hash: game_hash,
				address:   contract_address,
				game_id:   game_id,
				seed:      seed,
				name:      func_name,
				args:      args,
			}, delivered => { })
		} catch(e) {
		}
	}

	getFastRandom(seed, callback){
		if (!this.RTC_game) {
			return
		}

		let game_code        = this.game_code
		let contract_address = this.contract_address

		console.log('game_code',game_code)

		let subscribe_name = false

		let listenRand = data => {
			if (!data || !data.seed || !data.user_id || !data.random ) {
				return
			}

			if (data.seed != seed) {
				return
			}

			this.RTC_game.unsubscribe(contract_address, listenRand, subscribe_name)

			if (!this.checkSIG(seed, data.random, data.user_id)) {
				console.error('invalid sig...')
			}

			callback(data)
		}

		try {
			subscribe_name = this.RTC_game.subscribe(contract_address, listenRand)

			this.RTC_game.send({
				action:    'get_random',
				game_code: game_code,
				address:   contract_address,
				seed:      seed,
			}, delivered => { })
		} catch(e) {
		}
	}

	checkSIG(rawMsg, signature, bankrollerAddress){
		let v = Utils.hexToNum(signature.slice(130, 132)) // 27 or 28
		let r = signature.slice(0, 66)
		let s = '0x' + signature.slice(66, 130)

		let msg_openkey = false

		try {
			msg_openkey = Utils.buf2bytes32( this.Account.lightWallet.signing.recoverAddress(rawMsg, v, r, s) )
		} catch(e) {
			console.error('recoverAddress err:',e)
			return false
		}

		let ok = (msg_openkey==bankrollerAddress)

		if (!ok) {
			console.error('invalid sig', msg_openkey+'!=='+bankrollerAddress)
		};

		return ok
	}








	/*
	 * GameChannels
	 *
	 */
	ropstenLink(addr){
		return '<a target="_blank" href="https://ropsten.etherscan.io/address/'+addr+'">'+addr+'</a>'
	}

	startChannelGame(game_code, deposit, callback, log){
		this.channels_address = this.channels_address || '0x498bebe17f5c21a7e00e6e73d1fcfc45d1e8d7ce'
		this.game_code        = game_code

		const rtc_room = 'game_channel_'+game_code
		const user_id  = this.Account.get().openkey

		log('Connect to game webrtc room: "'+rtc_room+'"...')

		this.RTCg = new RTC(user_id, rtc_room)

		log('Approve contract: '+this.ropstenLink(this.channels_address)+' ...')

		// Approve
		// this.setGameContract(this.channels_address, ()=>{
			log('Contract approved!')

			log('Find bankrollers...')

			// this.findGameChannelBankroller(deposit, (bankroller, bankroll_deposit)=>{
				// log('Set bankroller '+this.ropstenLink(bankroller)+', max deposit: '+bankroll_deposit+' BET')
				let bankroll_deposit = 3
				this.openGameChannel(deposit, bankroll_deposit, open_result => {
					console.log(open_result)
				})

			// })

		// })
	}

	openGameChannel(player_deposit, bankroll_deposit, callback){
		this.game_channel_id = Utils.makeSeed()
		this.channel_nonce   = 0

	 	// open(bytes32 id, address player, uint playerDeposit, uint bankrollDeposit, uint nonce, uint time, bytes sig) {
		const args = {
			channel_id       :  this.game_channel_id       ,
			address_player   :  this.Account.get().openkey ,
			player_deposit   : +player_deposit   * 10 ** 8 ,
			bankroll_deposit : +bankroll_deposit * 10 ** 8 ,
			nonce            : +this.channel_nonce         ,
			time             :  100                        ,
		}

		const msgHash = Casino.web3.utils.soliditySha3.apply(this, Object.values(args))

		this.Account.signMsgHash(msgHash, singnedMsgHash=>{
			console.log('signMsgHash: '+msgHash+' => '+singnedMsgHash)

			var rec = Casino.web3.eth.accounts.recover(msgHash, singnedMsgHash)
			console.log('recover', rec)
		})

		return

		const types = ['bytes32', 'address', 'uint', 'uint', 'uint', 'uint']
	 	const rawMsg  = ABI.rawEncode(types, Object.values(args)).toString('hex')


		this.Account.signMsg(rawMsg, singnedMsg=>{
			this.Account.signMsgHash(msgHash, singnedMsgHash=>{
				console.log('rawMsg', rawMsg)
				console.log('msgHash', msgHash)
				console.log('singnedMsgHash', singnedMsgHash)

				if (!this.Account.checkSIG(rawMsg, singnedMsg, this.Account.get().openkey )) {
					setTimeout(()=>{
						this.openGameChannel(player_deposit, bankroll_deposit, callback)
					}, 2000)
					return
				}


				this.RTCg.send({
					action     : 'open_channel',
					game_code  : this.game_code,
					address    : this.channels_address,
					singnedMsg : singnedMsg,
					args       : args,
					sig        : singnedMsgHash,
				}, delivered => {

				})
			})
		})

	}

	findGameChannelBankroller(deposit, callback){
		const listenRes = data=>{
			if (data.action!=='bankroller_active') return

			if (data.deposit < 2*deposit) {
				return
			}
			callback( data.user_id, 2*deposit )
			this.RTCg.unsubscribe(this.channels_address, listenRes)
		}

		this.RTCg.subscribe(this.channels_address, listenRes)


		// this.RTC_game.send({
		// 	action:    'callFunction',
		// 	game_code: this.game_code,
		// 	address:   this.contract_address,
		// 	game_id:   this.game_id,
		// 	name:      func_name,
		// 	args:      args,
		// }, delivered => {
		// 	if (delivered && delivered_callback) delivered_callback()
		// })

	}

}
