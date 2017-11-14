import _config    from 'config/config'
import Rtc        from 'API/rtc'
import EthHelpers from 'Eth/helpers'
import Acc        from 'Eth/Account'
import * as Utils from 'utils/utils'

import paychannelLogic from './paychannel'
const payChannelWrap = function(logic){
	let payChannel             = new paychannelLogic()
	logic.prototype.payChannel = payChannel
	let modifiedLogic          = new logic()
	modifiedLogic.payChannel   = payChannel
	return modifiedLogic
}

const Account = new Acc( _config, ()=>{}, false )
const web3    = Account.web3
const Eth     = new EthHelpers()

/*
 * DApp constructor
 */


/**
 * DApp interface to bankroller side
 *
 * @see https://daocasino.readme.io/
 *
 * @example
 *  const GameLogic = function(){
 *  	const play = function(a){
 *  		...
 *  	}
 *  	return { play:play }
 *  }
 *	const MyDApp = new DCLib.DApp({
 *		code  : 'dicegame_v2' , // unique DApp code
 *		logic : GameLogic     , // inject logic constructor in your DApp
 *	})
 *
 *  
 * @export
 * @class DApp
 * @extends {DCLib}
 */
export default class DApp {
	/**
	 * DApp contructor
	 *
	 * @param  {Object} params - DApp settings
	 * @param  {Object.string} code
	 * @param  {Object.function} logic
	 * @return {DApp}
	 */
	constructor(params) {
		if (!params.code) {
			console.error('Create DApp error', params)
			throw new Error('code option is required')
			return 
		}

		if (!DAppsLogic[params.code] || !DAppsLogic[params.code]) {
			console.log('First you need define your DApp logic')
			console.log('Example DCLib.defineDAppLogic("'+params.code+'", function(){...})')
			throw new Error('Cant find DApp logic')
		}

		let logic = DAppsLogic[params.code]

		this.code  = params.code
		this.hash  = Utils.checksum( logic )		
		this.logic = payChannelWrap( logic )

		this.Room = false 
		this.sharedRoom = new Rtc( Account.get().openkey, 'dapp_room_'+this.hash )	

		console.groupCollapsed('DApp %c'+this.code+' %ccreated','color:orange','color:default')
		
		console.info(' >>> Unique DApp logic checksum/hash would be used for connect to bankrollers:')
		console.info('%c SHA3: %c' + this.hash , 'background:#333; padding:3px 0px 3px 3px;', 'color:orange; background:#333; padding:3px 10px 3px 3px;')
		
		console.groupCollapsed('Logic string')
		console.log( Utils.clearcode( DAppsLogic[params.code] ) )
		console.groupEnd()

		console.groupCollapsed('DApp.sharedRoom / messaging methods now available')
		console.group('send(data, callback=false, repeat=5)')
		console.log('Send message to room, in callback args pass delivered=true')
		console.groupEnd()
			
		console.group('on(event, callback)')
		console.log(['Listen room messages',
			'Ex.events: all, action::bankroller_active, user_id:0xsd...',
			' room.send({action:"myaction", somedata:{}})',
			' room.on("action::myaction", function(data){})',
		].join('\n'))
		console.log('For send message to specific user write send({address:"0xUserOpenkey"})')
		console.groupEnd()

		console.groupEnd()

		console.groupEnd()
	}

	/**
	 * Connection of a player with a bankroll
	 * @example
	 * DApp.connect({bankroller : "auto", paychannel:{deposit:1}}, function(connected, info){})
	 * 
	 * @param  {Object} params
	 * @param  {Object.string} bankroller - address or 'auto' for autofind bankroller 
	 * @param  {Object.Object} optional - paychannel config
	 * @param  {Object.Object.string} deposit - paychannel deposit
	 * @return {[type]}
	 */
	async connect(params={}, callback=false){
		
		console.group('DApp %c'+this.code+' %cconnecting...','color:orange','color:default')

		let def_params = {bankroller: 'auto'}

		params = Object.assign( def_params, params )

		if (params.paychannel && (!params.paychannel.deposit || isNaN(params.paychannel.deposit*1) )) {
			console.error('Oops, paychannel.deposit*1 - is not a number')
			throw new Error(' 💴 Deposit is required to open paychannel')
			return
		}

		if (params.paychannel && typeof params.paychannel.contract != 'object' ){
			params.paychannel.contract = _config.contracts.paychannel
		}


		let deposit = (params.paychannel && params.paychannel.deposit) ? params.paychannel.deposit : 0 

		deposit = Utils.bet4dec(deposit)
		if (params.paychannel && params.paychannel.deposit) {
			params.paychannel.deposit = deposit
		}

		let bankroller_address = params.bankroller || 'auto'

		console.log('params:')
		console.table(Object.assign(params,{
			deposit    : deposit,
			bankroller : bankroller_address,
		}))

		if (bankroller_address == 'auto') {
			bankroller_address = await this.findBankroller( deposit )
		}
		console.info('📫 Bankroller address:', bankroller_address)
		

		let con_t = setTimeout(()=>{
			console.error('⌛ Connection timeout.... 🤐🤐🤐 ')
			callback(false, null)
			return
		}, 7777)

		this.connection_info = {
			bankroller_address : bankroller_address
		}

		try {	
			const connection = await this.request({ action:'connect', address:bankroller_address })

			if (!connection.id) {
				cosole.error('😓 Cant establish connection....')
				callback(false, null)
				return
			}

			clearTimeout(con_t)

			console.log('🔗 Connection established ', connection)
			
			this.Room = new Rtc( Account.get().openkey, this.hash+'_'+connection.id )

			this.connection_info.id        = connection.id
			this.connection_info.room_name = this.hash+'_'+connection.id
		} catch(e){
			console.error(' 🚬 Connection error...',e)
			callback(false, null)
			return
		}
		

		console.groupCollapsed(' 🚪 Personal user<->bankroller room created')
		console.log('personal room name: ', this.Room.name )
		console.groupEnd()
		console.groupCollapsed('Now you can call logic functions')
		console.log('MyDApp.call("function_name", [arg1, arg2], function(result){})')
		console.groupEnd()
		
		console.groupEnd()


		if (params.paychannel) {

			// Check than payChannel logic exist
			if (typeof this.logic.payChannel !== 'object') {
				console.log('')
				console.log('')
				
				console.log('If you want to use paychannel, you need to use .payChannel functions in your logic')
				console.log('this is reseved property, for get user wins in BETs')
				console.log('it need for check results on bankroller side')
				console.log('DONT REMOVE .payChannel from your logic')
				console.log('')
				throw new Error('logic.payChannel - required')
				return
			}

			params.paychannel.bankroller_address = this.connection_info.bankroller_address
			
			this.connection_info.channel = await this.openChannel(params.paychannel)			
		}

		if(callback) callback(true, this.connection_info)
	}

	openChannel(params){
		console.group(' 🔐 Open channel with deposit', params.deposit)

		return new Promise( async (resolve, reject) => {

			// Check user balance			
			const user_balance = await Eth.getBalances(Account.get().openkey)
			
			const mineth = 0.01
			const minbet = Utils.bet2dec(params.deposit)
			
			if (mineth!==false && user_balance.eth*1 < mineth*1) {
				console.error(user_balance.eth+' is very low, you need minimum '+mineth)
				reject({error:'low balance'})
				// throw new Error('Low ETHs balance')
				return false
			}

			if (minbet!==false && user_balance.bets*1 < minbet*1) {
				console.error('Your BET balance '+user_balance.bets+' <  '+minbet)
				reject({error:'low balance'})
				// throw new Error('Low BETs balance')
				return false
			}
			

			const approve = await Eth.ERC20approve(params.contract.address, params.deposit)


			// Open channel args
			const channel_id         = Utils.makeSeed()
			const player_address     = Account.get().openkey
			const bankroller_address = params.bankroller_address
			const player_deposit     = params.deposit
			const bankroller_deposit = params.deposit*2
			const session            = 0
			const ttl_blocks         = 101

			// console.info(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks)
			// Sign hash from args
			const signed_args = Account.signHash( Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks) )
			
			console.log('🙏 ask the bankroller to open the channel')
			
			let dots_i = setInterval(()=>{
				const items = ['wait', 'just moment', 'bankroller work, wait ))', '..','...','wait when bankroller open channel','yes its not so fast', 'this is Blockchain 👶', 'TX mine...']
				console.log( '⏳ ' + items[Math.floor(Math.random()*items.length)] )
			}, 1500)

			let response = await this.request({ 
				action     : 'open_channel',
				deposit    : params.deposit,
				paychannel : params.contract.address,
				open_args  : {
					channel_id         : channel_id         ,
					player_address     : player_address     ,
					bankroller_address : bankroller_address ,
					player_deposit     : player_deposit     ,
					bankroller_deposit : bankroller_deposit ,
					session            : session            ,
					ttl_blocks         : ttl_blocks         ,
					signed_args        : signed_args        ,
				}
			})

			clearInterval(dots_i)


			response.channel_id         = channel_id
			response.player_deposit     = params.deposit
			response.bankroller_deposit = params.deposit*2
			response.session            = 0

			if (response.receipt && response.receipt.transactionHash) {
				// Set deposit in logic
				this.logic.payChannel.setDeposit( Utils.bet2dec(player_deposit) )

				response.contract_address = response.receipt.to

				console.log('🎉 Channel opened https://ropsten.etherscan.io/tx/'+response.receipt.transactionHash)
				console.groupCollapsed('channel info')
				console.log(response)
				console.groupEnd()
			}

			resolve(response)

			console.groupEnd()
		})
	}


	call(function_name, function_args=[], callback){
		if (!this.Room) {
			console.warn('You need .connect() before call!')
			return
		}
		
		console.log('Call function '+function_name+'...')
		return new Promise(async(resolve, reject) => {

			let res = await this.request({
				action:'call',
				func: {
					name:function_name,
					args:function_args,
				}
			})

			let local_returns = this.logic[function_name].apply(this, res.args)
			
			// timestamps broke this check
			// if (JSON.stringify(local_returns) != JSON.stringify(res.returns)) {
			// 	console.warn('💣💣💣 the call function results do not converge!')
			// 	console.log(JSON.stringify(local_returns), JSON.stringify(res.returns))
			// }
			
			console.groupCollapsed('call "'+function_name+'" log:')
			console.log('You send args:', function_args)
			console.log('Bankroller signed args:', res.args)
			console.log('Bankroller call result:', res.returns)
			console.log('You local call result:', local_returns)
			console.groupEnd()

			const adv = {
				bankroller : {
					args   : res.args,
					result : res.returns,
				},
				local: {
					args   : function_args,
					result : local_returns,
				}
			}

			resolve(res.returns, adv)

			if (callback) callback(res.returns, adv)
		})
	}



	async disconnect(params, callback=false){
		let result = {}
		
		if (this.connection_info.channel) {
			result.channel = await this.closeChannel(params.paychannel)
		}

		result.connection = await this.request({ action:'disconnect' })

		this.connection_info = {}
		
		if (callback) callback(result)
	}


	closeChannel(params){
		const profit = this.logic.payChannel._getProfit()

		if (this.connection_info.channel===false) return 

		console.group('  Close channel with profit', profit)

		return new Promise( async (resolve, reject) => {

			const open_data = this.connection_info.channel
			
			// close channel args
			const channel_id         =  open_data.channel_id // bytes32 id, 
			const player_balance     =  profit + open_data.player_deposit // uint playerBalance, 
			const bankroller_balance = -profit + open_data.bankroller_deposit // uint bankrollBalance, 
			const session            =  0 // uint session=0px 

			console.info(channel_id, player_balance, bankroller_balance, session)
			// Sign hash from args
			const signed_args = Account.signHash( Utils.sha3(channel_id, player_balance, bankroller_balance, session) )
			
			console.log('🙏 ask the bankroller to close the channel')
			
			let dots_i = setInterval(()=>{
				const items = ['wait', 'closing...', 'yes its really not so easy', '..','...','bankroller verify checksums of results...', '']
				console.log( '⏳ ' + items[Math.floor(Math.random()*items.length)] )
			}, 1500)

			const receipt = await this.request({ 
				action     : 'close_channel' ,
				profit     : profit   ,
				paychannel : open_data.contract_address,
				close_args  : {
					channel_id         : channel_id         ,
					player_balance     : player_balance     ,
					bankroller_balance : bankroller_balance ,
					session            : session            ,
					signed_args        : signed_args        ,
				}
			})

			clearInterval(dots_i)

			if (receipt.transactionHash) {
				console.log('🎉 Channel closed https://ropsten.etherscan.io/tx/'+receipt.transactionHash)
				console.groupCollapsed('close receipt')
				console.log(receipt)
				console.groupEnd()
			}

			this.connection_info.channel = false
			resolve(receipt)

			console.groupEnd()
		})
	}

	/*
		Отправка сообщения банкролеру с запросом
		и ожидание ответа, типа коллбэка
	*/
	request(params, callback=false, Room=false){
		Room = Room || this.Room || this.sharedRoom
		
		params.address = params.address || this.connection_info.bankroller_address

		if (!params.address) {
			console.error('params.address is empty ... ', params)
			console.info('set bankroller address in params')
			return
		}

		return new Promise((resolve, reject) => {

			const uiid = Utils.makeSeed()
			
			params.type = 'request'
			params.uiid = uiid

			// Wait response
			Room.once('uiid::'+uiid, result=>{
				if (callback) callback(result)
				resolve(result.response)
			})

			// Send request
			Room.send(params, delivered => {
				if (!delivered) {
					console.error('🙉 Cant send msg to bankroller, connection error')
					reject('undelivered')
					return
				}
			})

		})
	}

	response(request_data, response, Room=false){
		Room = Room || this.Room || this.sharedRoom

		request_data.response = response
		request_data.type     = 'response'

		Room.send(request_data)
	}

	findBankroller(deposit=false){
		console.info(' 🔎 Find bankrollers in shared Dapp room...')
		return new Promise((resolve, reject) => {
			const checkBankroller = data => {
				if (deposit && data.deposit < deposit) {
					return
				}

				// return bankroller openkey
				resolve( data.user_id )

				this.sharedRoom.off('action::bankroller_active', checkBankroller)
			}

			this.sharedRoom.on('action::bankroller_active', checkBankroller)
		})
	}
}
