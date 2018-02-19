/* global DCLib */

import _config         from 'config/config'
import Rtc             from 'dc-messaging'
import EthHelpers      from 'Eth/helpers'
import Acc             from 'Eth/Account'
import * as Utils      from 'utils/utils'

import PayChannelLogic from './paychannel'

/**
 *
 * @todo write description
 *
 * @param {Function} logic - DApp logic
 */
const payChannelWrap = function (Logic) {
  let payChannel             = new PayChannelLogic()
  Logic.prototype.payChannel = payChannel
  let modifiedLogic          = new Logic()
  modifiedLogic.payChannel   = payChannel

  return modifiedLogic
}

/** @ignore */
const Account = new Acc(_config, () => {}, false)
/** @ignore */
const web3    = Account.web3
/** @ignore */
const Eth     = new EthHelpers()

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
      console.error('Create DApp error', params)
      throw new Error('slug option is required')
    }

    if (!window.DAppsLogic[params.slug] || !window.DAppsLogic[params.slug]) {
      console.log('First you need define your DApp logic')
      console.log('Example DCLib.defineDAppLogic("' + params.slug + '", function(){...})')
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

    /** Add contract's */
    if (params.contract) {
      console.log('Your contract is add')
      this.contract_address = params.contract.contract_address
      this.contract_abi = params.contract.contract_abi
    } else {
      console.log('Standart payChannel contract is add')
      this.contract_address = _config.contracts.paychannel.address
      this.contract_abi = _config.contracts.paychannel.abi
    }

    /** @ignore */
    this.Room = false
    /** @ignore */
    this.sharedRoom = new Rtc(Account.get().openkey, 'dapp_room_' + this.hash)

    console.groupCollapsed('DApp %c' + this.slug + ' %ccreated', 'color:orange', 'color:default')
    console.info(params)
    console.info(' >>> Unique DApp logic checksum/hash would be used for connect to bankrollers:')
    console.info('%c SHA3: %c' + this.hash, 'background:#333; padding:3px 0px 3px 3px;', 'color:orange; background:#333; padding:3px 10px 3px 3px;')

    console.groupCollapsed('Logic string')
    console.log(Utils.clearcode(window.DAppsLogic[params.slug]))
    console.groupEnd()

    console.groupCollapsed('DApp.sharedRoom / messaging methods now available')
    console.group('send(data, callback=false, repeat=5)')
    console.log('Send message to room, in callback args pass delivered=true')
    console.groupEnd()

    console.group('on(event, callback)')
    console.log(['Listen room messages',
      'Ex.events: all, action::bankroller_active, user_id:0xsd...',
      ' room.send({action:"myaction", somedata:{}})',
      ' room.on("action::myaction", function(data){})'
    ].join('\n'))
    console.log('For send message to specific user write send({address:"0xUserOpenkey"})')
    console.groupEnd()

    console.groupEnd()

    console.groupEnd()
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
    console.group('DApp %c' + this.slug + ' %cconnecting...', 'color:orange', 'color:default')

    let def_params = {bankroller: 'auto'}

    params = Object.assign(def_params, params)

    if (params.paychannel && (!params.paychannel.deposit || isNaN(params.paychannel.deposit * 1))) {
      console.error('Oops, paychannel.deposit*1 - is not a number')
      throw new Error(' 💴 Deposit is required to open paychannel')
    }

    if (params.paychannel && typeof params.paychannel.contract !== 'object') {
      params.paychannel.contract = _config.contracts.paychannel
    }

    let deposit = (params.paychannel && params.paychannel.deposit) ? params.paychannel.deposit : 0

    deposit = Utils.bet2dec(deposit)
    if (params.paychannel && params.paychannel.deposit) {
      params.paychannel.deposit = deposit
    }

    let bankroller_address = params.bankroller || 'auto'

    console.log('params:')
    console.table(Object.assign(params, {
      deposit    : deposit,
      bankroller : bankroller_address
    }))

    if (bankroller_address === 'auto') {
      bankroller_address = await this.findBankroller(deposit)
    }
    console.info('📫 Bankroller address:', bankroller_address)

    let connectionResult = false
    let conT = setTimeout(() => {
      console.error('⌛ Connection timeout.... 🤐🤐🤐 ')
      callback(connectionResult, null)
    }, 7777)

    /**    Ifomation fromconnection(id, room_name, bankroller_address) */
    this.connection_info = {
      bankroller_address: bankroller_address
    }

    try {
      const connection = await this.request({
        action  : 'connect',
        slug    : this.slug,
        address : bankroller_address
      })

      if (!connection.id) {
        console.error('😓 Cant establish connection....')
        return callback(connectionResult, null)
      }

      clearTimeout(conT)

      console.log('🔗 Connection established ', connection)

      this.Room = new Rtc(Account.get().openkey, this.hash + '_' + connection.id)

      this.connection_info.id = connection.id
      this.connection_info.room_name = this.hash + '_' + connection.id
    } catch (e) {
      console.error(' 🚬 Connection error...', e)
      return callback(connectionResult, null)
    }

    console.groupCollapsed(' 🚪 Personal user<->bankroller room created')
    console.log('personal room name: ', this.Room.name)
    console.groupEnd()
    console.groupCollapsed('Now you can call logic functions')
    console.log('MyDApp.call("function_name", [arg1, arg2], function(result){})')
    console.groupEnd()

    console.groupEnd()

    if (params.paychannel) {
      // Check than payChannel logic exist
      if (typeof this.logic.payChannel !== 'object') {
        console.log('')
        console.log('')

        console.log('If you want to use paychannel, you need to use .payChannel functions in your logic')
        console.log('this is reseved property, for get user wins in BETs')
        console.log('it need for check results on bankroller side')
        console.log('DONT REMOVE .payChannel from your logic')
        console.log('')
        throw new Error('logic.payChannel - required')
      }

      params.paychannel.bankroller_address = this.connection_info.bankroller_address
      this.connection_info.channel = await this.openChannel(params.paychannel, params.gamedata)
    }

    connectionResult = true
    if (callback) callback(connectionResult, this.connection_info)
    this.updateState()
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
    console.group(' 🔐 Open channel with deposit', params.deposit)
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
        console.error(user_balance.eth + ' is very low, you need minimum ' + mineth)
        reject(new Error({error: 'low balance'}))
        // throw new Error('Low ETHs balance')
        return false
      }

      if (minbet !== false && user_balance.bets * 1 < minbet * 1) {
        console.error('Your BET balance ' + user_balance.bets + ' <  ' + minbet)
        reject(new Error({error: 'low balance'}))
        // throw new Error('Low BETs balance')
        return false
      }

      await Eth.ERC20approve(contract_address, params.deposit)

      // Open channel args

      const channel_id         = Utils.makeSeed()
      const player_address     = Account.get().openkey
      const bankroller_address = params.bankroller_address
      const player_deposit     = params.deposit
      const bankroller_deposit = params.deposit * 2
      const session            = 0
      const ttl_blocks         = 120
      // window.paychannel         = new PaychannelLogic(parseInt(bankroller_deposit))

      console.info(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks)

      // Sign hash from args
      const signed_args = Account.signHash(Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks, game_data))

      console.log(bankroller_deposit)
      console.log('🙏 ask the bankroller to open the channel')

      let dots_i = setInterval(() => {
        const items = ['wait', 'just moment', 'bankroller work, wait ))', '..', '...', 'wait when bankroller open channel', 'yes its not so fast', 'this is Blockchain 👶', 'TX mine...']
        console.log('⏳ ' + items[Math.floor(Math.random() * items.length)])
      }, 1500)

      console.log('Game data: ', game_data)

      let response = await this.request({
        action     : 'open_channel',
        deposit    : params.deposit,
        paychannel : contract_address,
        open_args: {
          channel_id         : channel_id,
          player_address     : player_address,
          player_deposit     : player_deposit,
          bankroller_address : bankroller_address,
          session            : session,
          ttl_blocks         : ttl_blocks,
          gamedata           : game_data,
          signed_args        : signed_args
        }
      })

      if (response.more) {
        console.log('the previous transaction was not completed')
      }

      clearInterval(dots_i)

      response.channel_id         = channel_id
      response.player_deposit     = params.deposit
      response.bankroller_deposit = params.deposit * 2
      response.session            = 0

      this.logic.payChannel.setDeposit(Utils.dec2bet(player_deposit))
      if (response.receipt && response.receipt.transactionHash) {
        // Set deposit in logic
        response.contract_address = response.receipt.to

        console.log('🎉 Channel opened https://ropsten.etherscan.io/tx/' + response.receipt.transactionHash)
        console.groupCollapsed('channel info')
        console.log(response)
        console.groupEnd()
      }

      resolve(response)
      console.groupEnd()
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
      console.warn('You need .connect() before call!')
      return
    }

    console.log('Call function ' + function_name + '...')
    return new Promise(async (resolve, reject) => {
      let res = await this.request({
        action: 'call',
        func: {
          name : function_name,
          args : function_args
        }
      })

      let local_returns = this.logic[function_name].apply(this, res.args)

      // timestamps broke this check
      // if (JSON.stringify(local_returns) != JSON.stringify(res.returns)) {
      //  console.warn('💣💣💣 the call function results do not converge!')
      //  console.log(JSON.stringify(local_returns), JSON.stringify(res.returns))
      // }

      console.groupCollapsed('call "' + function_name + '" log:')
      console.log('You send args:', function_args)
      console.log('Bankroller signed args:', res.args)
      console.log('Bankroller call result:', res.returns)
      console.log('You local call result:', local_returns)
      console.groupEnd()

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

  // responseOnline(params) {

  //  console.log('PARAMS@@@',params)
  //  this.response(params, {msg: 'msg'})
  // }

  /**
   * which produces a trip from the game and bankroller
   *
   * @example
   * window.MyDApp.disconnect({...})
   *
   * @param {Object} params
   * @param {Object.object} params.paychannel -
   * @param {boolean} [callback=false]
   *
   * @memberOf DApp
   */
  async disconnect (params, callback = false) {
    let result = {}

    if (this.connection_info.channel) {
      result.channel = await this.closeChannel(params)
    }

    result.connection = await this.request({action: 'disconnect'})

    this.connection_info = {}

    if (callback) callback(result)
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
  closeChannel (params = false) {
    const profit = this.logic.payChannel._getProfit()
    if (this.connection_info.channel === false) return

    console.group('  Close channel with profit', profit)

    return new Promise(async (resolve, reject) => {
      const open_data = this.connection_info.channel

      // close channel args
      const channel_id         = open_data.channel_id // bytes32 id,
      const player_balance     = Utils.bet2dec(this.logic.payChannel.getBalance()) // profit + open_data.player_deposit // uint playerBalance,
      const bankroller_balance = Utils.bet2dec(this.logic.payChannel.getBankrollBalance()) // -profit + open_data.bankroller_deposit // uint bankrollBalance,
      const session            = params.session || 0 // uint session=0px
      const bool               = true

      // console.log('@@@@@@@@', player_balance, bankroller_balance)
      // Sign hash from args
      const signed_args = Account.signHash(Utils.sha3(channel_id, player_balance, bankroller_balance, session, bool))

      console.log('🙏 ask  the bankroller to close the channel')

      let dots_i = setInterval(() => {
        const items = ['wait', 'closing...', 'yes its really not so easy', '..', '...', 'bankroller verify checksums of results...', '']
        console.log('⏳ ' + items[Math.floor(Math.random() * items.length)])
      }, 1500)

      const receipt = await this.request({
        action     : 'close_channel',
        profit     : profit,
        paychannel : open_data.contract_address,
        close_args: {
          channel_id         : channel_id,
          user_id            : Account.get().openkey,
          player_balance     : player_balance,
          bankroller_balance : bankroller_balance,
          session            : session,
          bool               : bool,
          signed_args        : signed_args
        }
      })

      clearInterval(dots_i)

      if (receipt.transactionHash) {
        console.log('🎉 Channel closed https://ropsten.etherscan.io/tx/' + receipt.transactionHash)
        console.groupCollapsed('close receipt')
        console.log(receipt)
        console.groupEnd()
      }

      this.logic.payChannel.reset()
      this.connection_info.channel = false
      resolve(receipt)

      console.groupEnd()
    })
  }

  /** Save state this game */
  async updateState (params = false, callback = false) {
    if (typeof this.connection_info.channel === 'undefined') return
    // if (typeof this.connection_info.channel.channel_id === 'undefined') return

    const channel_id     = this.connection_info.channel.channel_id
    const player_address = Account.get().openkey
    const bool           = true

    let player_balance
    let bankroller_balance
    let session

    if (typeof params.player_balance !== 'undefined' && typeof params.bankroller_balance !== 'undefined' && typeof params.session !== 'undefined') {
      session = params.session
    } else {
      session = 0
    }

    player_balance     = Utils.bet2dec(this.logic.payChannel.getBalance())
    bankroller_balance = Utils.bet2dec(this.logic.payChannel.getBankrollBalance())

    const hash        = Utils.sha3(channel_id, player_balance, bankroller_balance, session, bool)
    const signed_args = Account.signHash(hash)

    if (DCLib.checkHashSig(hash, signed_args, player_address) === false) {
      console.error('🚫 invalid sig on update state', player_address)
      this.response(params, {error: 'Invalid sig'})
      return
    }

    const receipt = await this.request({
      action : 'update_state',
      update_args: {
        channel_id         : channel_id,
        player_address     : player_address,
        player_balance     : player_balance,
        bankroller_balance : bankroller_balance,
        session            : session,
        bool               : bool,
        signed_args        : signed_args
      }
    })

    if (receipt) {
      console.log(' 🎉 State updated')
    }

    if (callback) callback(receipt)
  }

  PayChannel () {
    if (this.PayChannelContract) return this.PayChannelContract

    let pay_contract_abi     = ''
    let pay_contract_address = ''

    if (typeof this.contract_address !== 'undefined' && typeof this.contract_abi !== 'undefined') {
      pay_contract_abi     = this.contract_abi
      pay_contract_address = this.contract_address
    }

    this.PayChannelContract = new web3.eth.Contract(pay_contract_abi, pay_contract_address)
    return this.PayChannelContract
  }

  /** TODO - Доделывать */
  async updateChannel (params, callback = false) {
    // console.log('PARAMS_UPDATE_CHANNEL@', params)
    const channel_id         = this.connection_info.channel.channel_id
    const player_balance     = params.player_balance
    const bankroller_balance = params.bankroller_balance
    const session            = params.session
    const signed_args        = params.signed_args
    // const signed_args2    = params.signed_args2
    const bankroll_address   = this.connection_info.bankroller_address

    const hash = Utils.sha3(channel_id, player_balance, bankroller_balance, session)

    if (DCLib.checkHashSig(hash, signed_args, bankroll_address) === false) {
      console.error('🚫 invalid sig on update channel')
      this.response(params, {error: 'Invalid sig'})
      return
    }

    const gasLimit = 900000
    const receipt = await this.PayChannel().methods
      .updateChannel(
        channel_id,
        player_balance,
        bankroller_balance,
        session,
        signed_args
      ).send({
        gas      : gasLimit,
        gasPrice : 1.2 * _config.gasPrice,
        from     : Account.get().openkey
      })
      .on('transactionHash', transactionHash => {
        console.log('# updateChannel TX pending', transactionHash)
        console.log('https://ropsten.etherscan.io/tx/' + transactionHash)
        console.log('⏳ wait receipt...')
      }).on('error', err => {
        console.warn('Update channel error', err)
        this.response(params, {error: 'cant update channel', more: err})
      })

    if (receipt.transactionHash) {
      console.log('🎉 Channel updated https://ropsten.etherscan.io/tx/' + receipt.transactionHash)
      console.groupCollapsed('close receipt')
      console.log(receipt)
      console.groupEnd()
    }

    this.response(params, {receipt: receipt})
    if (callback) callback(receipt)
  }

  /** TODO - Доделывать */
  async updateGame (params, callback = false) {
    const channel_id       = this.connection_info.channel.channel_id
    const session          = params.session
    const round            = params.round
    const seed             = params.seed
    const game_data        = params.game_data
    const sig_player       = params.sig_player
    const sig_bankroll     = params.sig_bankroll
    const player_address   = Account.get().openkey
    const bankroll_address = this.connection_info.bankroller_address

    const hash = Utils.sha3(channel_id, session, round, seed, game_data)

    if (DCLib.checkHashSig(hash, sig_player, player_address) === false || DCLib.checkHashSig(hash, sig_bankroll, bankroll_address) === false) {
      console.error('🚫 invalid sig on update game')
      this.response(params, {error: 'Invalid sig'})
      return
    }

    const gasLimit = 900000
    const receipt = await this.PayChannel().methods
      .updateGame(
        channel_id,
        session,
        round,
        seed,
        game_data.value,
        sig_player,
        sig_bankroll
      ).send({
        gas      : gasLimit,
        gasPrice : 1.2 * _config.gasPrice,
        from     : Account.get().openkey
      })
      .on('transactionHash', transactionHash => {
        console.log('# openchannel TX pending', transactionHash)
        console.log('https://ropsten.etherscan.io/tx/' + transactionHash)
        console.log('⏳ wait receipt...')
      }).on('error', err => {
        console.warn('Open channel error', err)
        this.response(params, {error: 'cant open channel', more: err})
      })

    if (receipt.transactionHash) {
      console.log('🎉 Game updated https://ropsten.etherscan.io/tx/' + receipt.transactionHash)
      console.groupCollapsed('close receipt')
      console.log(receipt)
      console.groupEnd()
    }

    this.response(params, {receipt: receipt})
    if (callback) callback(receipt)
  }

  /** TODO - Доделывать */
  async openDispute (params, callback = false) {
    const open_data    = this.connection_info.channel
    const channel_id   = open_data.channel_id
    const round        = params.round
    const dispute_seed = params.dispute_seed
    const game_data    = params.gamedata
    const session      = params.session

    // console.log('PARAMS', channel_id, round, dispute_seed, game_data)
    const gasLimit = 900000
    const receipt = this.PayChannel().methods
      .openDispute(
        channel_id,
        session,
        round,
        dispute_seed,
        game_data.value
      ).send({
        gas      : gasLimit,
        gasPrice : 1.2 * _config.gasPrice,
        from     : Account.get().openkey
      })
      .on('transactionHash', transactionHash => {
        console.log('# openchannel TX pending', transactionHash)
        console.log('https://ropsten.etherscan.io/tx/' + transactionHash)
        console.log('⏳ wait receipt...')
      }).on('error', err => {
        console.warn('Open channel error', err)
        this.response(params, {error: 'cant open channel', more: err})
      })

    this.response(params, {receipt: receipt})
    if (callback) callback(receipt)
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
      console.error('params.address is empty ... ', params)
      console.info('set bankroller address in params')
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
          console.error('🙉 Cant send msg to bankroller, connection error')
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
    request_data.type     = 'response'

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
    console.info(' 🔎 Find bankrollers in shared Dapp room...')

    let noBankroller = setTimeout(function noInf (params) {
      console.info(' 🔎 Not bankroller with the same deposit, find continue')
      noBankroller = setTimeout(noInf, 8000)
    }, 8000)

    return new Promise((resolve, reject) => {
      const checkBankroller = data => {
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
