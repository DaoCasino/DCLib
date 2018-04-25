import _config         from '../config/config'
import * as messaging  from 'dc-messaging'
import EthHelpers      from '../Eth/helpers'
import RSA             from '../API/rsa'
import Acc             from '../Eth/Account'
import EE              from 'event-emitter'
import * as Utils      from '../utils/utils'
import PayChannelLogic from './paychannel'

/**
 *
 * @todo write description
 *
 * @param {Function} logic - DApp logic
 */
const payChannelWrap = function (Logic) {
  let payChannel = new PayChannelLogic()
  Logic.prototype.payChannel = payChannel
  let modifiedLogic = new Logic()
  modifiedLogic.payChannel = payChannel

  return modifiedLogic
}

/** @ignore */
const Account = new Acc(_config, () => {}, false)
/** @ignore */
const web3 = Account.web3
/** @ignore */
const Eth = new EthHelpers()

/**
 * @ignore
 */
const EC = function () {}; EE(EC.prototype)

const channelState = (function () {
  let state = {
    '_id'                : '',
    '_playerBalance'     : '',
    '_bankrollerBalance' : '',
    '_totalBet'          : '',
    '_session'           : '',
    '_sign'              : ''
  }

  return {
    set (data) {
      let new_state = {}
      for (let k in state) {
        if (!data[k]) {
          console.error('Invalid channel state format in channelState.set')
          console.error('Missing ' + k)
        }
        new_state[k] = data[k]
      }
      state = Object.assign({}, new_state)
    },
    get () {
      return state
    }
  }
})()

/*
 * DApp constructor
 */

/**
 * DApp interface to bankroller side
 *
 * [See readme](https://daocasino.readme.io/)
 *
 * @example
 * DCLib.defineDAppLogic('dicegame_v2', function(){
 *    const play = function(a){
 *      ...
 *    }
 *    return { play:play }
 * })
 *
 * const MyDApp = new DCLib.DApp({
 *   slug  : 'dicegame_v2' , // unique DApp slug
 * })
 *
 *
 * @export
 * @class DApp
 * @extends {DCLib}
 */
export default class DApp {
  /**
   * @ignore
   */
  constructor (params) {
    if (!params.slug) {
      throw new Error('slug option is required')
    }

    if (!window.DAppsLogic[params.slug] || !window.DAppsLogic[params.slug]) {
      throw new Error('Cant find DApp logic')
    }

    let logic = window.DAppsLogic[params.slug]
    /** DApp name */
    this.slug = params.slug
    this.code = params.slug
    /** @ignore */
    this.hash = Utils.checksum(this.slug)
    /** DApp logic */
    this.logic = payChannelWrap(logic)
    this.RSA   = new RSA()
    this.debug = true

    if (typeof params.debug !== 'undefined') {
      this.debug = params.debug
    }

    /** Add contract's */
    if (params.contract) {
      this.contract_address = params.contract.address
      this.contract_abi     = params.contract.abi
    } else {
      this.contract_address = _config.contracts.paychannel.address
      this.contract_abi     = _config.contracts.paychannel.abi
    }
    this.web3 = web3
    this.PayChannel = new this.web3.eth.Contract(this.contract_abi, this.contract_address)

    this.web3.eth.defaultAccount = Account.get().openkey

    /** @ignore */
    this.Room = false
    /** @ignore */
    this.sharedRoom = new messaging.RTC(Account.get().openkey, 'dapp_room_' + this.hash)
    // check this.sharedRoom.on('all', console.log)

    /** @ignore */
    this.Status       = new EC()
    this.info_channel = EE()
  }

  /**
   * Connection of a player with a bankroll
   * @example
   * DApp.connect({bankroller : "auto", paychannel:{deposit:1}}, function(connected, info){})
   *
   * @param  {Object} params
   * @param  {Object.string} bankroller - address or 'auto' for autofind bankroller
   * @param  {Object.Object} optional - paychannel config
   * @param  {Object.Object.string} deposit - paychannel deposit
   * @return {[type]}
   */
  async connect (params = {}, callback = false) {
    if (this.debug) Utils.debugLog('DApp %c' + this.slug + ' %cconnecting...', 'color:orange', 'color:default', _config.loglevel)

    let def_params = {bankroller: 'auto'}

    params = Object.assign(def_params, params)

    if (params.paychannel && (!params.paychannel.deposit || isNaN(params.paychannel.deposit * 1))) {
      throw new Error(' 💴 Deposit is required to open paychannel')
    }

    if (params.paychannel && typeof params.paychannel.contract !== 'object') {
      params.paychannel.contract = _config.contracts.paychannel
    }

    let deposit = (params.paychannel && params.paychannel.deposit) ? params.paychannel.deposit : 0

    if (Number(deposit) === 0) {
      this.Status.emit('error', {code: 'deposit null', 'text': 'your deposit can not be 0'})
      throw new Error('😓 Your deposit can not be 0')
    }

    deposit = Utils.bet2dec(deposit)
    if (params.paychannel && params.paychannel.deposit) {
      params.paychannel.deposit = deposit
    }

    let bankroller_address = params.bankroller || 'auto'

    if (bankroller_address === 'auto') {
      this.Status.emit('connect::info', {status: 'findBankroller', data: {deposit: deposit}})
      bankroller_address = await this.findBankroller(deposit)
      this.Status.emit('connect::info', {status: 'find_compleate', data: bankroller_address})
    }
    if (this.debug) Utils.debugLog(['📫 Bankroller address:', bankroller_address], _config.loglevel)

    let connectionResult = false
    let conT = setTimeout(() => {
      this.Status.emit('error', {code: 'timeout', 'text': 'Connection timeout'})
      throw new Error('⌛ Connection timeout.... 🤐🤐🤐 ', 'error')
      // callback(connectionResult, null)
    }, 7777)

    /**    Ifomation fromconnection(id, room_name, bankroller_address) */
    this.connection_info = { bankroller_address: bankroller_address }

    try {
      this.Status.emit('connect::info', {status: 'connect', data: {bankroller_address: bankroller_address}})
      const connection = await this.request({
        action  : 'connect',
        slug    : this.slug,
        address : bankroller_address
      })

      if (!connection.id) {
        this.Status.emit('error', {code: 'unknow', 'text': 'Cant establish connection'})
        Utils.debugLog('😓 Cant establish connection....', 'error')
        return callback(connectionResult, null)
      }

      clearTimeout(conT)

      if (this.debug) Utils.debugLog(['🔗 Connection established ', connection], _config.loglevel)
      this.Status.emit('connect::info', {status: 'connected', data: {connection: connection}})

      this.Room = new messaging.RTC(
        Account.get().openkey,
        this.hash + '_' + connection.id,
        {privateKey:Account.exportPrivateKey(), allowed_users:[bankroller_address]}
      )

      this.connection_info.id = connection.id
      this.connection_info.room_name = this.hash + '_' + connection.id
    } catch (e) {
      this.Status.emit('error', {code: 'unknow', 'text': 'Connection error', err: e})
      Utils.debugLog([' 🚬 Connection error...', e], 'error')
      return callback(connectionResult, null)
    }

    if (params.paychannel) {
      // Check than payChannel logic exist
      if (typeof this.logic.payChannel !== 'object' && _config.loglevel !== 'none') {
        throw new Error('logic.payChannel - required')
      }

      this.Status.emit('connect::info', {status: 'openChannel', data: {paychannel: params.paychannel}})
      params.paychannel.bankroller_address = this.connection_info.bankroller_address
      this.connection_info.channel = await this.openChannel(params.paychannel, params.gamedata)
    }

    connectionResult = true
    if (callback) callback(connectionResult, this.connection_info)
  }

  /**
   * Open channel for game for player and bankroller
   *
   * @example
   * window.MyDApp.openChannel(0.15)
   *
   * @param {Object} params - object for params open channel
   * @param {Object.number} deposit - quantity bets for game
   * @returns - none
   *
   * @memberOf DApp
   */
  openChannel (params, game_data = false) {
    if (this.debug) Utils.debugLog([' 🔐 Open channel with deposit', params.deposit], _config.loglevel)

    return new Promise(async (resolve, reject) => {
      let contract_address
      this.contract_address
        ? contract_address = this.contract_address
        : contract_address = params.contract.address

      // Check user balance
      const user_balance = await Eth.getBalances(Account.get().openkey)

      const mineth = 0.01
      const minbet = Utils.dec2bet(params.deposit)

      if (mineth !== false && user_balance.eth * 1 < mineth * 1) {
        Utils.debugLog(user_balance.eth + ' is very low, you need minimum ' + mineth, 'error')
        reject(new Error({error: 'low balance'}))
        return false
      }

      if (minbet !== false && user_balance.bets * 1 < minbet * 1) {
        Utils.debugLog('Your BET balance ' + user_balance.bets + ' <  ' + minbet, 'error')
        reject(new Error({error: 'low balance'}))
        return false
      }

      // Approve ERC20
      this.Status.emit('connect::info', { status: 'ERC20approve', data: {} })
      await Eth.ERC20approve(contract_address, 0)
      await Eth.ERC20approve(contract_address, params.deposit)

      // Ask data from bankroller for open channel
      const args = {
        channel_id     : Utils.makeSeed(),
        player_address : Account.get().openkey,
        player_deposit : params.deposit,
        game_data      : [0]
      }
      // args and sign from bankroller
      const b_args = await this.request({
        action : 'open_channel',
        args   : args
      })

      // Проверяем возвращаемые банкроллером аргументы путем валидации хеша
      const to_verify_hash = [
        {t: 'bytes32', v: args.channel_id                      },
        {t: 'address', v: args.player_address                  },
        {t: 'address', v: b_args.args.bankroller_address       },
        {t: 'uint',    v: '' + args.player_deposit             },
        {t: 'uint',    v: '' + b_args.args.bankroller_deposit  },
        {t: 'uint',    v: b_args.args.opening_block            },
        {t: 'uint',    v: args.game_data                       },
        {t: 'bytes',   v: b_args.args._N                       },
        {t: 'bytes',   v: b_args.args._E                       }
      ]
      const recover_openkey = web3.eth.accounts.recover(Utils.sha3(...to_verify_hash), b_args.signed_args)
      if (recover_openkey.toLowerCase() !== params.bankroller_address.toLowerCase()) {
        this.Status.emit('connect::error', {
          status : 'error',
          msg    : 'Bankroller open channel args invalid',
          data   : {}
        })
        return
      }

      // Создаем RSA с ключем банкроллера
      // для дальнейшей верификации сообщения от него
      this.RSA.create(Utils.remove0x(b_args.args._N))

      // Send open channel TX
      const gasLimit = 4600000
      this.PayChannel.methods
        .openChannel(
          args.channel_id,
          args.player_address,
          b_args.args.bankroller_address,
          +args.player_deposit,
          +b_args.args.bankroller_deposit,
          +b_args.args.opening_block,
          args.game_data,
          b_args.args._N,
          b_args.args._E,
          b_args.signed_args
        ).send({
          gas      : gasLimit,
          gasPrice : 1.2 * _config.gasPrice,
          from     : args.player_address
        })
        .on('transactionHash', transactionHash => {
          this.connection_info.txHash = transactionHash
          Utils.debugLog(`Open channel transaction ${transactionHash}`, _config.loglevel)
        })
        .on('confirmation', async (confirmationNumber) => {
          if (confirmationNumber >= _config.tx_confirmations) {
            const check = await this.request({action : 'check_open_channel'})
            if (!check.error && check.status === 'ok') {
              // Set deposit to paychannel in game logic
              this.logic.payChannel._setDeposits(
                args.player_deposit,
                b_args.args.bankroller_deposit
              )

              resolve(Object.assign(check.info, args))
            } else {
              reject(check)
            }
          }
        })
        .on('error', err => {
          this.Status.emit('connect::error', {
            status : 'error',
            msg    : err,
            data   : {}
          })
          reject(err)
        })
    })
  }

  /**
   * @todo write description and example
   *
   * @param {any} function_name - name contract method
   * @param {any} [function_args=[]]
   * @param {any} callback
   * @returns
   *
   * @memberOf DApp
   */
  call (function_name, function_args = [], callback) {
    if (typeof this.logic[function_name] !== 'function') {
      throw new Error(function_name + ' not exist')
    }

    if (!this.Room) {
      this.Status.emit('connect::error', {
        status : 'error',
        msg    : 'No room',
        data   : {}
      })
      Utils.debugLog('You need .connect() before call!', _config.loglevel)
      return
    }

    Utils.debugLog('Call function ' + function_name + '...', _config.loglevel)
    return new Promise(async (resolve, reject) => {
      // Up session
      this.session = this.session || 0
      this.session++

      // Find rnd object
      let rnd_i = null
      let gamedata = []
      let user_bet = 0
      function_args.forEach((arg, i) => {
        if (typeof arg === 'object' && arg.rnd && arg.rnd.gamedata && arg.rnd.bet) {
          rnd_i    = i
          gamedata = arg.rnd.gamedata
          user_bet = arg.rnd.bet
        }
      })

      if (!this.connection_info.channel._totalBet) {
        this.connection_info.channel._totalBet = 0
      }
      this.connection_info.channel._totalBet += user_bet

      // Sign call data
      const data = {
        channel_id : this.connection_info.channel.channel_id,
        session    : +this.session,
        user_bet   : '' + user_bet,
        gamedata   : gamedata,
        seed       : Utils.makeSeed()
      }
      const to_sign = [
        {t: 'bytes32', v: data.channel_id    },
        {t: 'uint',    v: data.session       },
        {t: 'uint',    v: data.user_bet },
        {t: 'uint',    v: data.gamedata      },
        {t: 'bytes32', v: data.seed          }
      ]
      const sign = Eth.signHash(Utils.sha3(...to_sign))

      // Call function in bankroller side
      const res = await this.request({
        action : 'call',
        data   : data,
        sign   : sign,
        func   : {
          name : function_name,
          args : function_args
        }
      })

      // Проверяем корректность подписи рандома
      const rnd_hash_args = [
        {t: 'bytes32', v: data.channel_id },
        {t: 'uint',    v: data.session    },
        {t: 'uint',    v: data.user_bet   },
        {t: 'uint',    v: data.gamedata   },
        {t: 'bytes32', v: data.seed       }
      ]
      const rnd_hash = Utils.sha3(...rnd_hash_args)

      if (!this.RSA.verify(rnd_hash, res.rnd_sign)) {
        this.Status.emit('connect::error', {
          status : 'error',
          msg    : 'Invalid sign for random!',
          data   : {}
        })
        return
      }

      // Проверяем что рандом сделан из этой подписи
      if (res.args[rnd_i] !== Utils.sha3(res.rnd_sign)) {
        this.Status.emit('connect::error', {
          status : 'error',
          msg    : 'Invalid random!',
          data   : {}
        })
        return
      }

      // Вызываем функцию в локальном gamelogic
      let local_returns = this.logic[function_name].apply(this, res.args)

      // проверяем подпись состояния канала
      const state_data = {
        '_id'                : this.connection_info.channel.channel_id,
        '_playerBalance'     : '' + this.logic.payChannel._getBalance().player,
        '_bankrollerBalance' : '' + this.logic.payChannel._getBalance().bankroller,
        '_totalBet'          : '' + this.connection_info.channel._totalBet,
        '_session'           : this.session
      }
      const state_hash = Utils.sha3(
        {t: 'bytes32', v: state_data._id                },
        {t: 'uint',    v: state_data._playerBalance     },
        {t: 'uint',    v: state_data._bankrollerBalance },
        {t: 'uint',    v: state_data._totalBet          },
        {t: 'uint',    v: state_data._session           }
      )
      const recover_openkey = web3.eth.accounts.recover(state_hash, res.state._sign)
      if (recover_openkey.toLowerCase() !== this.connection_info.bankroller_address.toLowerCase()) {
        this.Status.emit('connect::error', {
          status : 'error',
          msg    : 'Invalid state ' + recover_openkey + '!=' + this.connection_info.bankroller_address,
          data   : {}
        })
        // console.error('Invalid state ' + recover_openkey + '!=' + this.connection_info.bankroller_address)
        this.openDispute(data)
        return
      }
      // Сохраняем состояние с подписью банкроллера
      channelState.set(Object.assign(
        {'_sign' : res.state._sign },
        state_data
      ))

      // Отправляем банкроллеру свою подпись состояния
      // const updstate = await this.request({
      const upd_state_res = await this.request({
        action : 'update_state',
        state  : Object.assign(
          channelState.get(),
          {'_sign' : Eth.signHash(state_hash) }
        )
      })
      if (upd_state_res.status !== 'ok') {

      }

      // Возвращаем результат вызова функции
      const adv = {
        bankroller: {
          args   : res.args,
          result : res.returns
        },
        local: {
          args   : function_args,
          result : local_returns
        }
      }

      resolve(res.returns, adv)
      if (callback) callback(res.returns, adv)
    })
  }

  /**
   * which produces a trip from the game and bankroller
   *
   * @example
   * window.MyDApp.disconnect({...})
   *
   * @param {Object} params
   * @param {boolean} [callback=false]
   *
   * @memberOf DApp
   */
  async disconnect (callback = false) {
    let result = {}

    if (this.connection_info.channel) {
      result.channel = await this.closeByConsent()
    }
    
    result.txHash     = this.connection_info.txHash
    result.connection = await this.request({action: 'disconnect'})

    this.connection_info = {}

    if (typeof callback === 'function') callback(result)
  }

  /**
   * Closin game channel and distribution balance
   *
   * @todo write description and example
   *
   * @param {Object} params
   * @returns
   *
   * @memberOf DApp
   */
  closeByConsent () {
    return new Promise(async (resolve, reject) => {
      const last_state = channelState.get()
      const close_data_hash = Utils.sha3(
        {t: 'bytes32', v: last_state._id                },
        {t: 'uint', v: last_state._playerBalance     },
        {t: 'uint', v: last_state._bankrollerBalance },
        {t: 'uint', v: last_state._totalBet          },
        {t: 'uint', v: last_state._session           },
        {t: 'bool', v: true                          }
      )
      const sign = Eth.signHash(close_data_hash)

      // Запрашиваем у банкроллера подпись закрытия канала
      // и отправляем свою на всякий случай
      const close_data = await this.request({
        action : 'close_by_consent',
        data   : last_state,
        sign   : sign
      })

      const recover_openkey = web3.eth.accounts.recover(close_data_hash, close_data.sign)
      if (recover_openkey.toLowerCase() !== this.connection_info.bankroller_address.toLowerCase()) {
        console.error('State ' + recover_openkey + '!=' + this.connection_info.bankroller_address)
        return
      }

      // Send open channel TX
      const gasLimit = 4600000
      this.PayChannel.methods
        .closeByConsent(
          last_state._id,
          last_state._playerBalance,
          last_state._bankrollerBalance,
          last_state._totalBet,
          last_state._session,
          true,
          close_data.sign
        ).send({
          gas      : gasLimit,
          gasPrice : 1.2 * _config.gasPrice,
          from     : Account.get().openkey
        })
        .on('transactionHash', transactionHash => {
          this.connection_info.txHash = transactionHash
          console.log('closeByConsent channel', transactionHash)
        })
        .on('confirmation', async (confirmationNumber) => {
          if (confirmationNumber >= _config.tx_confirmations) {
            const understand = await this.request({action : 'channel_closed'})
            console.log('understand:', understand)
            this.logic.payChannel.reset()
            this.connection_info.channel = false
            resolve({status:'ok'})
          }
        })
        .on('error', err => {
          console.error(err)
          reject(err)
        })
    })
  }

  async updateChannel () {
    const last_state = channelState.get()
    // let close_data_hash = Utils.sha3(
    //   {t: 'bytes32', v: last_state._id                },
    //   {t: 'uint', v: last_state._playerBalance     },
    //   {t: 'uint', v: last_state._bankrollerBalance },
    //   {t: 'uint', v: last_state._totalBet          },
    //   {t: 'uint', v: last_state._session           },
    //   {t: 'bool', v: true                          }
    // )
    if (!last_state || !last_state._sign || last_state._sign === '') {
      return
    }

    return new Promise(async (resolve, reject) => {
      const channel = await this.PayChannel.methods.channels(last_state._id).call()
      if (channel.open === false) { return }
      if (
        channel.session           === last_state.session &&
        channel._totalBet         === last_state._totalBet &&
        channel.playerBalance     === last_state._playerBalance &&
        channel.bankrollerBalance === last_state._bankrollerBalance
      ) {
        return
      }

      // Send open channel TX
      const gasLimit = 4600000
      this.PayChannel.methods
        .updateChannel(
          last_state._id,
          last_state._playerBalance,
          last_state._bankrollerBalance,
          last_state._totalBet,
          last_state._session,
          last_state._sign
        ).send({
          gas      : gasLimit,
          gasPrice : 1.2 * _config.gasPrice,
          from     : Account.get().openkey
        })
        .on('transactionHash', transactionHash => {
          console.log('openDispute channel', transactionHash)
        })
        .on('confirmation', async (confirmationNumber) => {
          if (confirmationNumber >= _config.tx_confirmations) {
            resolve()
          }
        })
        .on('error', err => {
          console.error(err)
          reject(err)
        })
    })
  }

  async openDispute (data) {
    await this.updateChannel()

    const to_sign = [
      {t: 'bytes32', v: data.channel_id    },
      {t: 'uint',    v: data.session       },
      {t: 'uint',    v: data.user_bet      },
      {t: 'uint',    v: data.gamedata      },
      {t: 'bytes32', v: data.seed          }
    ]
    const sign = Eth.signHash(Utils.sha3(...to_sign))

    return new Promise((resolve, reject) => {
      // Send open channel TX
      const gasLimit = 4600000
      this.PayChannel.methods
        .openDispute(
          data.channel_id,
          data.session,
          data.user_bet,
          data.gamedata,
          data.seed,
          sign
        ).send({
          gas      : gasLimit,
          gasPrice : 1.2 * _config.gasPrice,
          from     : Account.get().openkey
        })
        .on('transactionHash', transactionHash => {
          console.log('openDispute channel', transactionHash)
        })
        .on('confirmation', async (confirmationNumber) => {
          if (confirmationNumber >= _config.tx_confirmations) {

          }
        })
        .on('error', err => {
          console.error(err)
          reject(err)
        })
    })
  }

  /**
     * Send message to bankroller with query and
     * waiting response type callback
     *
     * @example
     * window.MyDApp.request({address: '0x1e05eb5aaa235403177552c07ff4588ea9cbdf87'})
     *
     * @param {Object} params
     * @param {Object.string} params.address - bankroller address
     * @param {Function} [callback=false] - callback function
     * @param {boolean} [Room=false] - info on room
     * @returns {Promise}
     *
     * @memberOf DApp
     */
  request (params, callback = false, Room = false) {
    Room = Room || this.Room || this.sharedRoom

    params.address = params.address || this.connection_info.bankroller_address

    if (!params.address) {
      Utils.debugLog(['params.address is empty ... ', params], 'error')
      Utils.debugLog('set bankroller address in params', _config.loglevel)
      return
    }

    return new Promise((resolve, reject) => {
      const uiid = Utils.makeSeed()

      params.type = 'request'
      params.uiid = uiid

      // Wait response
      Room.once('uiid::' + uiid, result => {
        if (callback) callback(result)
        resolve(result.response)
      })

      // Send request
      Room.send(params, delivered => {
        if (!delivered) {
          Utils.debugLog('🙉 Cant send msg to bankroller, connection error', _config.loglevel)
          reject(new Error('undelivered'))
        }
      })
    })
  }

  /**
     * Кeceiving a response from bankroller
     *
     * @todo write to example
     *
     * @param {Object} request_data - the object in which data from response
     * @param {Object} response - answer from bankroller
     * @param {boolean} [Room=false] - info on room
     *
     * @memberOf DApp
     */
  response (request_data, response, Room = false) {
    Room = Room || this.Room || this.sharedRoom

    request_data.response = response
    request_data.type = 'response'

    Room.send(request_data)
  }

  /**
     * Find to bankroller for game
     *
     * @example
     * window.MyDApp.findBankroller(1)
     * > 0x6e9bf3f9612d7099aee7c3895ba09b9c4b9474e2
     *
     * @param {Number} [deposit=false] - bets for game
     * @returns {String} - bankroller openkey
     *
     * @memberOf DApp
     */
  findBankroller (deposit = false) {
    if (this.debug) Utils.debugLog(' 🔎 Find bankrollers in shared Dapp room...', _config.loglevel)
    const Status = this.Status
    let noBankroller = setTimeout(function noInf (params) {
      Status.emit('connect::info', {status: 'noBankroller', data: {deposit: deposit}})
      Utils.debugLog(' 🔎 Not bankroller with the same deposit, find continue', _config.loglevel)
      noBankroller = setTimeout(noInf, 8000)
    }, 8000)

    return new Promise((resolve, reject) => {
      const checkBankroller = data => {
        this.Status.emit('connect::info', {
          status: 'bankrollerInfo',
          data: data
        })

        if (deposit && data.deposit < deposit) {
          return
        }

        // return bankroller openkey
        resolve(data.user_id)
        clearTimeout(noBankroller)
        this.sharedRoom.off('action::bankroller_active', checkBankroller)
      }
      this.sharedRoom.on('action::bankroller_active', checkBankroller)
    })
  }
}
