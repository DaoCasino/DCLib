let _config = {}
export default class Api {
	constructor(config){
		_config = config
	}

	request(params, adv_path=''){
		let query = Object.keys(params)
			.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
			.join('&')

		return fetch(_config.api_url + adv_path + '?' + query)
	}

	// call faucet
	addBets(address){
		return this.request({
			a:       'faucet',
			to:      address,
			network: _config.network,
		}).then( response => {
			return response.text()
		})
	}


	getBankrollers(){
		return this.request({
			a:       'bankrolls',
		}, 'proxy.php').then(r => {
			return r.json()
		}).then( )
	}

	sendSeed(address, seed, confirm){
		return this.request({
			a:       'confirm',
			address: address,
			vconcat: seed,
			result:  confirm,
		},'proxy.php').then( response => {
			return response.text()
		})
	}
}

