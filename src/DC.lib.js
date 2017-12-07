import _config    from './config/config'
import * as Utils from './utils/utils'
import EE         from 'event-emitter'
import Api        from './API/Api'

import EthHelpers from './Eth/helpers'
import Account    from './Eth/Account'
import DApp       from './DApps/DApp'
import printDocs  from './docs.js'

/**
 * Reload page if this is bankroller server
 */
import io from 'socket.io-client'

if (window && window.location.host.indexOf('localhost:')>-1 ) {
	const socket = io('http://localhost:9997')
	socket.on('reload_page', data=>{
		console.log('socket_event', data)
		window.location.reload()
	})
}



/**
 * @ignore
 */
const ourApi = new Api( _config )
/**
 * @ignore
 */
const Eth    = new EthHelpers()

/**
 * @ignore
 */
const EC     = function(){}; EE(EC.prototype)
/**
 * @ignore
 */
const Event  = new EC()

/**
 * @ignore
 */
let _ready = false


/**
 * Base class in global namespace.
 * 
 * Check it in your browser `console.log(DCLib)`  
 * 
 * DCLib is javascript library for integrate [dao.casino blockchain protocol](https://github.com/DaoCasino/Whitepaper).
 * Interact with [bankroller](https://github.com/DaoCasino/BankRollerApp), use [Signidice random algorithm](https://github.com/DaoCasino/Whitepaper/blob/master/DAO.Casino%20WP.md#35-algorithm-implemented-in-mvp-of-daocasino-protocol), and paymentchannels.
 * 
 * 
 * @export
 * @class DCLib
 * @version 0.2.2
 */
export default class DCLib {

	/** 
	 * @ignore
	 */
	constructor() {
		this.version = '0.2.2'

		/**
		 * little utilities
		 */
		this.Utils = Utils

		/**
		 * DApp constructor
		 */
		this.DApp  = DApp

		/**
		 * Some helpers, such as getBetsBalance()
		 */
		this.Eth   = Eth
		
		Event.on('_ready', ()=>{
			if (typeof localStorage.requestBets === 'undefined') {
				localStorage.requestBets = true
				ourApi.addBets( this.Account.get().openkey )
			}
			
			printDocs( window.DCLib )
			
			Event.emit('ready')
			_ready = true
		})
		
		/**
		 * Account instance
		 */
		this.Account = new Account( _config, ()=> setTimeout(()=> Event.emit('_ready') , 1) )

		/**
		 * WEB3 version 1.0  instance 
		 * We include web3 version 1.0 in our lib.
		 * You can use all methods described in official documentation
		 * 
		 * @see https://web3js.readthedocs.io/en/1.0/
		 */
		this.web3    = this.Account.web3
		
		
		/**
		 * ## Get ETH account information
		 * @param {String} address - Addres Ethereum account wallet
		 * @param {accessBalance} callback - callback function then access balance information
		 * @returns {Object} - return balance information  
		 * 
		 * @example
		 * > DCLib.Account.info('0x4d750610062f1b3ce35117ee3e19cfb657ef6e59').then( r => {}) 
		 *
		 * @example
		 * // method return
		 * Object {
		 *    openkey: address,
		 *    Object {
		 * 		 bets : 992.21
		 * 		 eth  : "1.748053851"
		 *    }
		 * }
		 */
		this.Account.info = async (address=false, callback=false)=>{
			if (!callback && typeof address === 'function') {
				callback = address
				address  = this.Account.get().address
			}
			
			address = address || this.Account.get().address
			
			const [bet, eth] = await Promise.all([
				this.Eth.getBetBalance( address ),
				this.Eth.getEthBalance( address )
			])
			
			const res = {
				openkey: address,
				balance: {
					eth:eth,
					bet:bet,
				}
			}
			
			if (callback) callback(res)
			return res
		}
		
	}

	/**
	 * Define DApp logic constructor function
	 * 
	 * @example
	 * DCLib.defineDAppLogic('game_name', function() {
	 * 		...game_logic
	 * })
	 * 
	 * @param {string} dapp_slug         unique slug of your dapp
	 * @param {function} logic_constructor constructor Dapp logic
	 */
	defineDAppLogic(dapp_slug, logic_constructor){
		if (!window.DAppsLogic) { window.DAppsLogic = {} }
		window.DAppsLogic[dapp_slug] = logic_constructor
	}

	/**
	 * ## DCLib.on(event, callback)
	 * adds the functional to event
	 * 
	 * @todo add examples and information about method
	 * 
	 * @param {any} event - event name
	 * @param {any} callback - function then functional for event 
	 * 
	 * @memberOf DCLib
	 */
	on(event, callback){
		if (_ready) callback(true)
		Event.on(event, callback)
	}

	/**
	 * ## DCLib.randomHash()
	 * Generate random hash
	 * 
	 * @example
	 * // example for method initialization
	 * 
	 * > DCLib.randomHash()
	 * 
	 * @example
	 * // example for method return
	 * 
	 * > "confirm(0x26157e636aea611dd8bb7bee2258fcf84e6714a75112392886ceafe6b19bf03f)"
	 * 
	 * @returns - random Hash
	 * 
	 * @memberOf DCLib
	 */
	randomHash() { return 'confirm('+Utils.makeSeed()+')' }

	/**
	 * ## DCLib.numFromHash(random_hash, min=0, max=10)
	 * Generate random number of hash
	 * 
	 * @example
	 * // example for method initialization
	 * 
	 * > DCLib.numFromHash("dsadafkojodjaskfjoasjdoasfjaspfdjoqijeeqwjeq")
	 * 
	 * @example
	 * // example for method return
	 * 
	 * > 44
	 * 
	 * @param {String} random_hash - hash for generate random num
	 * @param {number} [min=0] - min value for generate default = 0
	 * @param {number} [max=100] - max value for generate default = 100
	 * @returns {Number} - Random number
	 * 
	 * @memberOf DCLib
	 */
	numFromHash(random_hash, min=0, max=100){
		if (min > max) { let c = min; min = max; max = c }
		if (min==max) return max
		
		random_hash = Utils.remove0x(random_hash)

		max++
		return Utils.bigInt(random_hash,16).divmod(max-min).remainder.value + min
	}

    /**
     * ## DCLib.fauset(address=false)
     * method need for add free bets on account
     *
     * @example
     * // example for method initialization without param
     *
     * DCLib.faucet()
     *
     * @example
     * // example for method initialization with param
     *
     * DCLib.faucet('0xd4e9f60fc84b97080a1803cf2d4e1003313a2ea2')
     *
     * @param {String} [address=false] - account address
     * @returns - none
     *
     * @memberOf DCLib
     */

	async faucet(address=false, callback=false){
		address = address || this.Account.get().openkey
		return await ourApi.addBets( address )
	}

	/**
	 * ## DCLib.sigRecover(raw_msg, signed_msg)
	 * Like sigHashRecover but remove ’0x’(if exist) from rawMsg. 
	 * Recovers the Ethereum address which was used to sign the given data.
	 *
	 * @see http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#recover
	 *
	 * @example
	 * // example for method initialization
	 * 
	 * DCLib.sigRecover(
	 * 	`0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede`,
	 *  `0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba
	 *   760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c`
	 * )
	 * 
	 * @example
	 * // example for method return Eth address
	 * 
	 * > 0x621e24a7f55843a69766946d6b4b5938423c4a33
	 * 
	 * @param {String} raw_msg - hash message for recover.
	 * @param {String} signed_msg - signature message for recover.
	 * @returns {String} - the Ethereum address used to sign this data.
	 * 
	 * @memberOf DCLib
	 */
	sigRecover(raw_msg, signed_msg){
		raw_msg = Utils.remove0x(raw_msg)
		return this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase()
	}

	/**
	 * ## DCLib.sigHashRecover(raw_msg, signed_msg)
	 * Recovers the Ethereum address which was used to sign the given data. 
	 * to sign the given data.
	 *
	 * @see http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#recover
	 * 
	 * @example
	 * // example for method initialization
	 * 
	 * DCLib.sigRecover(
	 * 	`0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede`,
	 *  `0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba
	 *   760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c`
	 * )
	 * 
	 * @example
	 * // example for method return Eth address
	 * 
	 * > 0x621e24a7f55843a69766946d6b4b5938423c4a33
	 * 
	 * @param {String} raw_msg - hash message for recover.
	 * @param {String} signed_msg - signature message for recover.
	 * @returns {String} - the Ethereum address used to sign this data.
	 * 
	 * @memberOf DCLib
	 */
	sigHashRecover(raw_msg, signed_msg){ 
		return this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase()
	}
	
	/**
	 * ## DCLib.checkSig(raw_msg, signed_msg, need_address)
	 * Checks. whether this address refers to a signed message
	 * 
	 * @example
	 * // example for method initialization
	 * // when the address passes the test
	 * 
	 * DCLib.checkSig(
	 * '0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede', 
	 * `0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba
	 * 760038313b7e2a01674e773e5c2dec046b09fde1560dca38f35ca928765631c`, 
	 * '0x621e24a7f55843a69766946d6b4b5938423c4a33')
	 * 
	 * > true // because the address is being checked
	 * 
	 * @example
	 * // example for method initialization
	 * // when the address fails validation
	 * 
	 * DCLib.checkSig('0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede', 
	 * '0x04450a98e9a4d72f3b83b225c10954fc78569ebb637dd6600041ac61b320bb8b0ba760038313b7e2a
	 * 01674e773e5c2dec046b09fde1560dca38f35ca928765631c', 
	 * '0x621e24a7f55843a69766946d6b4b5938423c2a33')
	 * 
	 * > false // because the address does not pass the test
	 * 
	 * @param {any} raw_msg - hash message
	 * @param {any} signed_msg - signature message
	 * @param {any} need_address - check address
	 * @returns {bolean} - true/false
	 * 
	 * @memberOf DCLib
	 */
	checkSig(raw_msg, signed_msg, need_address){		
		raw_msg = Utils.remove0x(raw_msg)
		return ( need_address.toLowerCase() == this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase() )
	}

	/**
	 * ## DCLib.checkHashSig(raw_msg, signed_msg, need_address)
	 * 
	 * the method checks the address for the signature property 
	 * by means of the function web3.account.recover into which 
	 * the hash message and signature are transferred, 
	 * and if the returned result is equal to the transmitted address, 
	 * it returns true otherwise false
	 * 
	 * @example
	 * // if address valid
	 * 
	 * DCLib.checkHashSig("0x43ecd41650080ac1f83a0251c99851e81cb62896188a01fbbf6113b845145f8c", 
	 * `0xf27efaf10b963b69fee76879424c70ace9c4d1b0d8f40ecf7680aa09a420bec473d5fa0b1ccdd17
	 * 62f82f0eb4187637ffdda48b3d68ec71c1ce4f8aa4a28f2d41c`, 
	 * '0xdd47ea2258e80d5596df09bec42d33c7553bb9ed')
	 * 
	 * > true
	 * 
	 * 
	 * @example
	 * // if address don't valid
	 * 
	 * DCLib.checkHashSig("0x43ecd41650080ac1f83a0251c99851e81cb62896188a01fbbf6113b845145f8c", 
	 * `0xf27efaf10b963b69fee76879424c70ace9c4d1b0d8f40ecf7680aa09a420bec473d5fa0b1
	 * ccdd1762f82f0eb4187637ffdda48b3d68ec71c1ce4f8aa4a28f2d41c`, 
	 * '0xdd47ea2258e80d5596df09bec42d33c7553b2223')
	 * 
	 * > false
	 * 
	 * @param {any} raw_msg - message for check
	 * @param {any} signed_msg - message signature for chek
	 * @param {any} need_address - address which the need check
	 * @returns {Bollean} - true/false
	 * 
	 * @memberOf DCLib
	 */
	checkHashSig(raw_msg, signed_msg, need_address){		
		return ( need_address.toLowerCase() == this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase() )
	}

}
