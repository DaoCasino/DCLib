
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
	/**
	 * 
	 * @example
	 * const d = 1;
	 * 
	 * @param {any} address 
	 * @returns 
	 * 
	 * @memberOf Api
	 */
	addBets(address){
		return this.request({
			a       :       'faucet'  ,
			to      :      address    ,
			network : _config.network
		}).then( response => {
			return response.text()
		})
	}
}

