/* global fetch */

let _config = {}
export default class Api {
  constructor (config) {
    _config = config
  }

  request (params, advPath = '') {
    let query = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')

    return fetch(_config.api_url + advPath + '?' + query)
  }

  // call faucet
  /**
   *
   * @example
   * const d = 1;
   *
   * @param {any} address
   * @returns Promise
   *
   * @memberOf Api
   */
  addBets (address, callback = false) {
    if (!address) return
    return fetch(_config.api_url + '?to=' + address).then(r => {
      return r.json()
    }).then(json => {
      if (callback) callback(json)
      return json
    })
  }
}
