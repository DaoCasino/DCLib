import _config    from 'config/config'
import * as Utils from 'utils/utils'
import Event      from 'utils/event'
import printDocs  from './docs.js'

import Account from './Account.js'
import ethRPC  from 'API/RPC'
import Api     from 'API/Api'
import RTC     from 'API/rtc'
import WEB3    from 'web3/packages/web3'
import DApp    from 'DApps/DApp'


export default class DaoCasino {
	constructor() {
		this.Api   = new Api( _config )
		this.RPC   = new ethRPC( _config.rpc_url )
		this.web3  = new WEB3( new WEB3.providers.HttpProvider(_config.rpc_url) )
		this.Event = Event
		this.Utils = Utils
		this.DApp  = DApp


		Event.on('_ready', ()=>{
			if (typeof localStorage.requestBets === 'undefined') {
				localStorage.requestBets = true
				this.Api.addBets( this.Account.get().openkey )
			}

			this.RTC = new RTC( (this.Account.get().openkey || false) )
		
			printDocs( window.DCLib )

			Event.emit('ready')
		})

		this.Account = new Account( _config, ()=> setTimeout(()=> Event.emit('_ready') , 1) )
	}

	on(event, callback){
		Event.on(event, callback)
	}

	faucet(address=false){
		address = address || this.Account.get().openkey

		return this.Api.addBets( address )
	}

	async getBalances(address){
		const [bets, eth] = await Promise.all([
			this.Account.getBetBalance( address ),
			this.Account.getEthBalance( address )
		])

		return { bets:bets, eth:eth }
	}


}
