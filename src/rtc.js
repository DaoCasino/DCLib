import _config    from './config.js'
import DB         from './DB.js'
import * as Utils from './utils'



const signalserver = 'https://ws.dao.casino/mesh/'

const delivery_timeout = 3000

let _subscribes = {}

export default class RTC {
	constructor(user_id=false, room=false) {
		if (!room) {
			room = _config.rtc_room
		}

		this.user_id = user_id

		this.channel = false
		this.connect(room)
	}

	connect(room){
		this.channel = require('rtc-mesh')(require('rtc-quickconnect')(signalserver, {
			room:       room,
			iceServers: require('freeice')()
		}))

		this.channel.on('change', (key, value) => {
			if (!key || !value) { return }

			let data = {}

			try {
				data = JSON.parse(value)
			} catch(e) {
				return
			}

			if (data.user_id && data.user_id==this.user_id) {
				return
			}

			// if (this.isAlreadyReceived(data)) {
			// 	return
			// }

			this.acknowledgeReceipt(data)

			if (_subscribes['all']) {
				for(let k in _subscribes['all']){
					_subscribes['all'][k](data)
				}
			}

			if (!data.address || !_subscribes[data.address]) {
				return
			}


			for(let k in _subscribes[data.address]){
				if (typeof _subscribes[data.address][k] === 'function') {
					_subscribes[data.address][k](data)
				}
			}
		})
	}

	async isAlreadyReceived(data){
		if (!data.seed || data.action == 'delivery_confirmation') {
			return false
		}

		const seed_exist = await DB.get(_config.rtc_store, data.seed)
		console.log('seed_exist', seed_exist)
		if (seed_exist && this.isFreshSeed(seed_exist.t) ) {
			return true
		}
		console.log('add seed')
		DB.put(_config.rtc_store, { t:(new Date().getTime()) }, data.seed)
		return false
	}

	isFreshSeed(time){
		let ttl = 2*60*1000
		let livetime = (new Date().getTime()) - time*1
		return ( livetime < ttl )
	}

	async clearOldSeeds(){
		let seeds = await DB.values('groups')
		console.log('clearOldSeeds',seeds)
		for(let id in seeds){
			if (!this.isFreshSeed(seeds[id].t)){
				// DB.remove(_config.rtc_store, id)
			}
		}

		setTimeout(()=>{ this.clearOldSeeds() }, 10*1000 )
	}

	subscribe(address, callback, name=false){
		if (!_subscribes[address]) { _subscribes[address] = {} }

		if (name && _subscribes[address][name]) {
			return
		}

		if (name===false) {
			name = Utils.makeSeed()
		};

		_subscribes[address][name] = callback

		return name
	}

	unsubscribe(address, callback, name=false){
		if (name!==false && _subscribes[address][name]) {
			delete(_subscribes[address][name])
			return
		}

		let new_subs = {}
		for(let k in _subscribes[address]){
			if (_subscribes[address][k] && _subscribes[address][k].toString() == callback.toString()) {
				continue
			}
			new_subs[k] = _subscribes[address][k]
		}
		_subscribes[address] = new_subs
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
			address:  acquired_data.address,
			seed:     Utils.makeSeed(),
			action:   'delivery_confirmation',
			acquired: acquired_data,
		})
	}

	// Проверка получения сообщения
	CheckReceipt(sended_data, callback){
		let subscribe_name = false

		let address = sended_data.address
		let waitReceipt = data => {
			if (!data.action || data.action != 'delivery_confirmation') {
				return
			}

			if (this.equaMsgs(sended_data, data.acquired) ) {
				this.unsubscribe(address, waitReceipt, subscribe_name)

				if (this.CheckReceiptsT[sended_data.seed]) {
					clearTimeout(this.CheckReceiptsT[sended_data.seed])
				}

				callback(true)
			}
		}

		subscribe_name = this.subscribe(address, waitReceipt)


		if (!this.CheckReceiptsT) {
			this.CheckReceiptsT = {}
		}

		this.CheckReceiptsT[sended_data.seed] = setTimeout(()=>{
			this.unsubscribe(address, waitReceipt, subscribe_name)

			callback(false)
		}, delivery_timeout)
	}

	equaMsgs(msg1, msg2){
		return (JSON.stringify(msg1) == JSON.stringify(msg2))
	}

	// Отправка сообщения с ожидание подтверждения получения
	send(data, callback=false, repeat=5){
		if (!this.channel) {
			setTimeout(()=>{ this.send(data, callback) },1000)
			return
		}

		data = this.sendMsg(data)


		if (!data.address) {
			return
		}
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
		data.user_id = this.user_id

		if (!data.seed) {
			data.seed = Utils.makeSeed()
		}
		this.channel.set(this.user_id, JSON.stringify(data))
		return data
	}
}
