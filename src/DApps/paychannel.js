import * as Utils from 'utils/utils'

const h_max = 100 // mac items in history

let _deposit = false
let _balance = 0
let _profit  = 0
let _history = []





/**
 * Class for change Payment Channel Contract state.
 *
 * Instanse of this class, autoinject in your logic 
 * Lib automatically send transactions to [payment channel ethereum contract](https://github.com/DaoCasino/Template/blob/master/contracts/examples/paymentChannel.sol) 
 * all as you need is fixing change user balance with .addTX method.
 * Also you can get current state getBalance getDeposit or printLog for debug.
 * 
 * ## what is paychannel
 * Payment Channel Contract is class of techniques designed to allow users to make multiple transactions without commiting all of the transactions to the block chain. In a payment channel, only two transactions are added to the block chain but an unlimited or nearly unlimted number of payments can be made between the participants. 
 * 
 * @export
 * @class PayChannle
 * @extends {DApp}
 */
export default class PayChannel {
	constructor() {
		
		console.groupCollapsed('payChannel injected in DApp logic')
		console.log('Now your logic has methods for work with payment channel')
		console.table({
			getDeposit : 'for get start deposit',
			getBalance : 'current user balance',
			getProfit  : 'How many user up, balance-deposit',

			addTX : 'Change current user balance, ex: addTX(-1) ',

			printLog: 'console.log channel state'
		})
		console.groupEnd()
	}
	
	setDeposit(d){
		if (_deposit!==false) {
			console.error('Deposit allready set')
			return
		}
		_deposit = Utils.bet2dec(d)
		_balance = (1*_deposit)
		
		console.log('PayChannel::User deposit set '+_deposit+', now user balance:', _balance)
		return _balance
	}

	getDeposit(){ 
		console.log('PayChannel::getDeposit')
		return Utils.dec2bet(_deposit) 
	}

	getBalance(){ 
		console.log('PayChannel::getBalance')
		return Utils.dec2bet(_balance) 
	}
	
	getProfit(){ 
		console.log('PayChannel::getProfit')
		return Utils.dec2bet(_profit)  
	}
	
	_getProfit(){ 
		console.log('PayChannel::_getProfit')
		return _profit 
	}

	/**
	 * Add BET transaction to channel
	 *
	 * @example
	 * .payChannel.addTX( 1 )
	 * .payChannel.addTX( +2 )
	 * .payChannel.addTX( '2.5' )
	 * .payChannel.addTX( -2.5 )
	 * 
	 * .payChannel.printLog( -2.5 )
	 * 
	 * @param {string|int} profit - TX value in BETs
	 * @param {bool} convert - convet from BET to microbet, default - true
	 */
	addTX(p, convert=true){
		console.log('PayChannel::addTX')
		if (convert) {
			p = Utils.bet2dec(p)
			console.log('PayChannel::addTX - convert BET to minibet', p)
		}
		if ((''+p).indexOf('.') > -1) {
			throw new Error('addTX '+p+' invalid value, set convert param to true')
		}

		_profit += p*1
		_balance = _deposit + _profit
		
		_history.push({
			profit    : p,
			balance   : _balance,
			timestamp : new Date().getTime(),
		})

		_history = _history.splice(-h_max)

		return Utils.dec2bet(_profit)  
	}

	/**
	 * Print log in console
	 * 
	 * @return {array) - history array
	 */
	printLog(){
		console.groupCollapsed('Paychannel state:')
		console.table({
			Deposit : this.getDeposit() ,
			Balance : this.getBalance() ,
			Profit  : this.getProfit()  ,
		})
		console.groupCollapsed('TX History, last '+h_max+' items '+_history.length)
		console.log(_history)
		console.groupEnd()
		console.groupEnd()

		return _history
	}

	reset(){
		console.log('PayChannel::reset, set deposit balance profit to 0')
		_deposit = false
		_balance = 0
		_profit  = 0
		_history.push({reset:true, timestamp:new Date().getTime()})
	}
}