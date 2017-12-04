import _config    from 'config/config'
import EE         from 'event-emitter'

import * as Utils from 'utils/utils'

const signalserver     = 'https://ws.dao.casino/mesh/'
const delivery_timeout = 3000
const msg_ttl          = 10*60*1000


const seedsDB = (function(){
	const store_name = 'rtc_msgs_seeds'

	let _seeds = {}
	let w_time = false	
	const read = function(){
		if (!localStorage) { return }
		try {
			_seeds = JSON.parse( localStorage[store_name] )
		} catch(e){
			_seeds = {}
		}
	}
	const write = function(){
		if (!localStorage) { return }
		
		clearTimeout(w_time)
		w_time = setTimeout(function(){
			localStorage[store_name] = JSON.stringify(_seeds)
		}, 500)
	}

	read()

	return {	
		add(data, id){
			_seeds[id] = data
			write()
		},

		get(id){
			if (!_seeds[id]) read()

			return _seeds[id] || null
		},

		getAll(){
			return _seeds
		},

		remove(id){
			delete _seeds[id]
			write()
		}
	}
})()


export default class RTC {
	constructor(user_id=false, room=false) {
		room = room || _config.rtc_room
		
		const EC = function(){}
		EE(EC.prototype)
		this.Event = new EC()

		this.room_id = room
		this.user_id = user_id

		this.channel = false
		this.connect(room)

		this.clearOldSeeds()
	}

	connect(room){
		this.channel = require('rtc-mesh')(require('rtc-quickconnect')(signalserver, {
			room       : room                 ,
			iceServers : require('freeice')()
		}))

		this.channel.on('change', (key, value) => {
			if (!key || !value) { return }
			let data = {}

			try {
				data = JSON.parse(value)
			} catch(e) {
				return
			}

			if (data.user_id && data.user_id==this.user_id) { return }
			// if (data.room_id != this.room_id) {
			// 	return
			// }

			this.acknowledgeReceipt(data)


			this.Event.emit('all', data)
			
			if (data.uiid) {
				this.Event.emit('uiid::'+data.uiid, data)
			}

			if (data.type && data.action) {
				this.Event.emit(data.type+'::'+data.action, data)
			}

			if (data.action) {
				this.Event.emit('action::'+data.action, data)
			}

			if (data.address) {
				this.Event.emit('address::'+data.address, data)
			}

			if (data.user_id) {
				this.Event.emit('user_id::'+data.user_id, data)
			}

		})
	}

	async isAlreadyReceived(data){
		if (!data.seed || data.action == 'delivery_confirmation') { return false }

		const seed_exist = await seedsDB.get(data.seed)
		if (seed_exist && this.isFreshSeed(seed_exist.t) ) {
			return true
		}
		
		seedsDB.add({t:new Date().getTime()}, data.seed)
		
		return false
	}

	isFreshSeed(time){
		let ttl = msg_ttl || 7*1000
		let livetime = (new Date().getTime()) - time*1
		return ( livetime < ttl )
	}

	async clearOldSeeds(){
		let seeds = await seedsDB.getAll()
		
		if (seeds.length) console.log('clear old msgs seeds',seeds)
		
		for(let id in seeds){
			if (!this.isFreshSeed(seeds[id].t)){
				seedsDB.remove(id)
			}
		}

		setTimeout(()=>{ this.clearOldSeeds() }, 10*1000 )
	}


	on(event, callback){
		this.Event.on(event, callback)
	}
	
	once(event, callback){
		this.Event.once(event, callback)
	}

	off(event, callback){
		this.Event.off(event, callback)
	}

	subscribe(address, callback){
		this.on('address::'+address, callback)
	}

	unsubscribe(address, callback) {
		this.off('address::'+address, callback)
	}


	// Подтверждение получения принятого сообщения
	acknowledgeReceipt(acquired_data){
		if (!acquired_data.user_id  || !acquired_data.action
			|| acquired_data.user_id == this.user_id
			|| acquired_data.action  == 'delivery_confirmation'
			|| acquired_data.action  == 'bankroller_active') {
			
			return
		}

		this.sendMsg({
			address  : acquired_data.address   ,
			seed     : Utils.makeSeed()        ,
			action   : 'delivery_confirmation' ,
			acquired : acquired_data
		})
	}

	// Проверка получения сообщения
	CheckReceipt(sended_data, callback){

		let address = sended_data.address
		let waitReceipt = data => {
			if (!data.action || data.action != 'delivery_confirmation') {
				return
			}

			if (this.equaMsgs(sended_data, data.acquired) ) {
				this.unsubscribe(address, waitReceipt)

				if (this.CheckReceiptsT[sended_data.seed]) {
					clearTimeout(this.CheckReceiptsT[sended_data.seed])
				}

				callback(true)
			}
		}

		this.subscribe(address, waitReceipt)

		if (!this.CheckReceiptsT) { this.CheckReceiptsT = {} }

		this.CheckReceiptsT[sended_data.seed] = setTimeout(()=>{
			this.unsubscribe(address, waitReceipt)

			callback(false)
		}, delivery_timeout)
	}

	equaMsgs(msg1, msg2) { return (JSON.stringify(msg1) == JSON.stringify(msg2)) }

	// Отправка сообщения с ожидание подтверждения получения
	send(data, callback=false, repeat=5){
		if (!this.channel) {
			setTimeout(()=>{ this.send(data, callback) },1000)
			return
		}


		data = this.sendMsg(data)

		if (!data.address) { return }

		this.CheckReceipt(data, delivered=>{
			if (!delivered && repeat > 0) {
				repeat--
				this.send(data, callback, repeat)
				return
			}

			if(callback) callback(delivered)
		})
	}


	sendMsg(data){
		data.seed       = Utils.makeSeed()
		data.user_id    = this.user_id
		// data.room_id = this.room_id

		this.channel.set(this.user_id, JSON.stringify(data))
		
		return data
	}
}

