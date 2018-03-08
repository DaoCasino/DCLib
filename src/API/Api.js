/* global fetch */

/**
 * @ignore
 */
export default class Api {
  constructor (config = {}) {
    this._config = config
  }

  request (params, advPath = '') {
    let query = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')

    return fetch(this._config.api_url + advPath + '?' + query)
  }

  addBets (address, callback = false) {
    return fetch('https://platform.dao.casino/faucet?to=' + address).then(r => {
      return r.json()
    }).then(json => {
      if (callback) callback(json)
      return json
    })
  }
}
