import _config from 'config/config'
import Rtc     from 'API/rtc'
import Acc     from 'Account'

import * as Utils from 'utils/utils'

const Account = new Acc( _config )


// @TODO
const default_paymentchannel_contract = {
	address : '0x...',
	abi     : JSON.parse('{}')
}


/*
 * DApp constructor
 */
export default class DApp {
	constructor(params) {
		if (!params.code || !params.logic) {
			console.error('Create DApp error', params)
			throw new Error('code and logic is required')
			return 
		}

		this.code  = params.code
		this.logic = params.logic
		this.hash  = Utils.checksum( params.logic )
		this.room  = 'dapp_room_'+this.hash
		
		this.Room  = new Rtc( Account.get().openkey, this.room )

		

		console.groupCollapsed('DApp %c'+this.code+' %ccreated','color:orange','color:default')
		
		console.info(' >>> Unique DApp logic checksum/hash would be used for connect to bankrollers:')
		console.info('%c SHA3: %c' + this.hash , 'background:#333; padding:3px 0px 3px 3px;', 'color:orange; background:#333; padding:3px 10px 3px 3px;')
		
		console.groupCollapsed('Logic string')
		console.log( Utils.clearcode( params.logic ) )
		console.groupEnd()

		console.groupCollapsed('DApp.Room / messaging methods now available')
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


	async connect(params={}){
		
		console.group('DApp %c'+this.code+' %cconnecting...','color:orange','color:default')

		let def_params = {
			bankroller: 'auto',
			// paychannel:{
			// 	deposit : deposit,

			// 	contract: {
			// 		address: '0x...',
			// 		abi: {}
			// 	}
			// }
		}

		params = Object.assign( def_params, params )

		if (params.paychannel && (!params.paychannel.deposit || isNaN(params.paychannel.deposit*1) )) {
			console.error('Oops, paychannel.deposit*1 - is not a number')
			throw new Error('Deposit is required to open paychannel')
			return
		}

		if (params.paychannel && typeof params.paychannel.contract != 'object' ){
			params.paychannel.contract = default_paymentchannel_contract
		}


		let deposit = (params.paychannel && params.paychannel.deposit) ? deposit : false 

		let bankroller_address = params.bankroller || 'auto'

		console.log('params:')
		console.table(Object.assign(params,{
			deposit    : deposit,
			bankroller : bankroller_address,
		}))
	
		if (bankroller_address == 'auto') {
			bankroller_address = await this.findBankroller( deposit )
		}
		console.info('OK! Bankroller address:', bankroller_address)
		// connect
		// bankroller_address
		
		this.Room.send({
			action: 'connect',
			address: bankroller_address,
		})

		console.groupEnd()
	}

	findBankroller(deposit=false){
		console.info('Find bankrollers in shared Dapp room...')
		return new Promise((resolve, reject) => {
			const checkBankroller = data => {
				if (deposit && data.deposit < deposit) {
					return
				}

				// return bankroller openkey
				resolve( data.user_id )

				this.Room.off('action::bankroller_active', checkBankroller)
			}

			this.Room.on('action::bankroller_active', checkBankroller)
		})
	}

	getRandom(min,max){

	}

	openChannel(){}
	closeChannel(){}
	
}
