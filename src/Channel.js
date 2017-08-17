import * as Utils from './utils'
import channel_abi from './channel.abi.js'

export default class Channel {
	constructor(address=false, channel_id=false, Account, RPC) {
		if (!address) {
			return
		}

		this.Account       = Account
		this.RPC           = RPC

		this.address       = address.toLowerCase()

		this.playerAddress = this.Account.get().openkey

		this.channel_id    = channel_id || Utils.makeSeed()
	}

	open(deposit, callback, repeat=2){
		console.log('Check that channel is close')
		this.waitClose( channel_closed=>{
			console.log('channel_closed', channel_closed)

			if (!channel_closed) {
				callback({error:'channel_allready_open'})
				return
			}
			console.log('newChannel',this.channel_id)
			this.callFunc('newChannel', [ deposit, this.channel_id ], response => {
				if (!response || !response.result) {
					repeat--
					if (repeat > 0) {
						this.open(deposit, callback, repeat)
					}
					return
				}

				if (response.result && response.result.split('0').join('').length > 1 ) {
					this.waitOpen( callback )

					return
				}
				callback(false)
			})
		})
	}

	waitOpen(callback, repeat=29){ setTimeout(()=>{
		repeat--
		console.log('waitOpen r:', repeat, this.channel_id)
		this.RPC.request('eth_call', [{
			'to':   this.address,
			'data': '0x'
				+ Utils.hashName('getOpenChannel(address,bytes32)')
					+ Utils.pad(this.playerAddress.substr(2), 64)
					+ Utils.pad(this.channel_id.substr(2), 64)

		}, 'latest']).then( response => {
			let opened = false
			console.log('getOpenChannel response:', response)
			if (response && response.result) {
				opened = ( Utils.hexToNum(response.result, 16) > 0)
				console.log('opened >>')
				console.log(Utils.hexToNum(response.result, 16), opened)
				console.log('<< opened')
			}

			if (!opened && repeat > 0) {

				this.waitOpen(callback, repeat)

				return
			}

			console.log('getOpenChannel - latest')

			callback( opened )
		})
	}, 5000) }

	waitClose(callback, repeat=29){ setTimeout(()=>{
		repeat--
		console.log('waitClose r:',repeat, this.channel_id)
		this.RPC.request('eth_call', [{
			'to':   this.address,
			'data': '0x'
				+ Utils.hashName('getOpenChannel(address,bytes32)')
					+ Utils.pad(this.playerAddress.substr(2), 64)
					+ Utils.pad(this.channel_id.substr(2), 64)
		}, 'latest']).then( response => {
			let opened = true

			if (response && response.result) {
				opened = ( Utils.hexToNum(response.result, 16) > 0)
			}

			if (opened && repeat > 0) {
				this.waitClose(callback, repeat)
				return
			}

			callback( !opened )
		})
	}, 5000) }

	BETs(num){
		return num*100000000
	}

	callFunc(name, args, callback){
		this.Account.signedContractFuncTx( this.address, channel_abi, name, args, 0,
			signedTx => {
				this.RPC.request('eth_sendRawTransaction', ['0x'+signedTx], 0).then( callback )
			}
		)
	}


}
