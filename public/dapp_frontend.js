/* eslint-disable indent */
/* global fetch $ DCLib Game MyDApp localStorage */

$(document).ready(function () {
  // Create our DApp
  DCLib.on('ready', function () {
    DCLib.Account.initAccount(function () {
      $('#user_address').html('<a target="_blank" href="https://ropsten.etherscan.io/address/' + DCLib.Account.get().openkey + '">' + DCLib.Account.get().openkey + '</a>')
      $('#faucet').attr('href', 'https://platform.dao.casino/faucet?to=' + DCLib.Account.get().openkey)

      window.Dice = new DCLib.DApp({
        slug: 'dicetest_v42',
        contract: {
          address: '0x674f8b960d103ccbabc0b0201da0cd52b9f5d352',
          abi: JSON.parse('[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"disputes","outputs":[{"name":"disputeSeed","type":"bytes32"},{"name":"disputeBet","type":"uint256"},{"name":"initiator","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_session","type":"uint256"},{"name":"_disputeBet","type":"uint256"},{"name":"_gameData","type":"uint256[]"},{"name":"_disputeSeed","type":"bytes32"},{"name":"_sign","type":"bytes"}],"name":"openDispute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_gameData","type":"uint256[]"},{"name":"_bet","type":"uint256"}],"name":"getProfit","outputs":[{"name":"_profit","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"playerWL","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_N","type":"bytes"},{"name":"_E","type":"bytes"},{"name":"_rsaSign","type":"bytes"}],"name":"resolveDispute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_playerBalance","type":"uint256"},{"name":"_bankrollerBalance","type":"uint256"},{"name":"_totalBet","type":"uint256"},{"name":"_session","type":"uint256"},{"name":"_sign","type":"bytes"}],"name":"updateChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"config","outputs":[{"name":"maxBet","type":"uint256"},{"name":"minBet","type":"uint256"},{"name":"gameDevReward","type":"uint8"},{"name":"bankrollReward","type":"uint8"},{"name":"platformReward","type":"uint8"},{"name":"refererReward","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"channels","outputs":[{"name":"state","type":"uint8"},{"name":"player","type":"address"},{"name":"bankroller","type":"address"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollerBalance","type":"uint256"},{"name":"totalBet","type":"uint256"},{"name":"session","type":"uint256"},{"name":"endBlock","type":"uint256"},{"name":"RSAHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"rsa","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_hash","type":"bytes32"},{"name":"signature","type":"bytes"}],"name":"recoverSigner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"_sigseed","type":"bytes"},{"name":"_min","type":"uint256"},{"name":"_max","type":"uint256"}],"name":"generateRnd","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_playerBalance","type":"uint256"},{"name":"_bankrollerBalance","type":"uint256"},{"name":"_totalBet","type":"uint256"},{"name":"_session","type":"uint256"},{"name":"_close","type":"bool"},{"name":"_sign","type":"bytes"}],"name":"closeByConsent","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_gameData","type":"uint256[]"},{"name":"_bet","type":"uint256"},{"name":"_sigseed","type":"bytes"}],"name":"game","outputs":[{"name":"_win","type":"bool"},{"name":"_amount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"developer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"safeTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"refContract","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_player","type":"address"},{"name":"_bankroller","type":"address"},{"name":"_playerBalance","type":"uint256"},{"name":"_bankrollerBalance","type":"uint256"},{"name":"_openingBlock","type":"uint256"},{"name":"_gameData","type":"uint256[]"},{"name":"_N","type":"bytes"},{"name":"_E","type":"bytes"},{"name":"_sign","type":"bytes"}],"name":"openChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"gameWL","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"}],"name":"closeByTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_gameData","type":"uint256[]"},{"name":"_bet","type":"uint256"}],"name":"checkGameData","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_token","type":"address"},{"name":"_ref","type":"address"},{"name":"_gameWL","type":"address"},{"name":"_playerWL","type":"address"},{"name":"_rsa","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"playerBalance","type":"uint256"},{"indexed":false,"name":"bankrollerBalance","type":"uint256"},{"indexed":false,"name":"session","type":"uint256"}],"name":"logChannel","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"initiator","type":"address"},{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"session","type":"uint256"},{"indexed":false,"name":"seed","type":"bytes32"}],"name":"logDispute","type":"event"}]')
        },
        rules    : {
          depositX : 2
        }
      })
    })
  })

  // Init interface
  initView({
    // Create DApp and open payment channel
    onSetDeposit : startGame,

    // call DApp functions, and send res to bankroller
    onRoll       : callDAppFunc,

    // close payment channel, destroy DApp
    onEndGame    : endGame
  })
})

function startGame (deposit) {
  window.Dice.connect({
    bankroller : 'auto',
    paychannel : { deposit : deposit },
    gamedata   : {type:'uint', value:[1, 2, 3]}
  },
  function (connected, info) {
    console.log('connect result:', connected)
    console.log('connect info:', info)
    if (!connected) return

    let maxbet = DCLib.Utils.dec2bet(info.channel.player_deposit)

    $('#user_bet')[0].max = Math.ceil(maxbet)
    $('#user_bet').val((maxbet * 0.1).toFixed(2))

    $('body').addClass('cur-step-2').addClass('cur-step-3')
  })
}

function callDAppFunc (user_bet, user_num) {
  const random_hash = DCLib.randomHash({bet:user_bet, gamedata:[user_num]})

  window.Dice.Game(user_bet, user_num, random_hash)
  .then(function (result) {
      console.log('result', result)

      renderGames()
      var ubets = Game.payChannel.getBalance()
      $('#user_bet').max = ubets
    }
  )
}

function endGame () {
  window.Dice.disconnect(function (res) {
    console.log('disconnect result', res)
  })
}

function initView (callbacks) {
  let deposit_set = false
  const updBalance = function () {
    $('#user_balance').text('...')

    DCLib.Account.info(function (info) {
      $('#user_balance').text(info.balance.bet)
      $('#user_balance_eth').text(info.balance.eth)

      setTimeout(updBalance, 30000)

      if (info.balance.bet > 0) {
        $('body').addClass('cur-step-1')

        if (!deposit_set) {
          deposit_set = true
          var d = (info.balance.bet * 0.5).toFixed(2)
          if (d > 1) { d = 1 }
          $('#user_deposit').val(d)
        }
      }
    })
  }
  updBalance()

  $('body').addClass('cur-step-1')
  $('#loading').hide()
  $('#content').show()

  $('.step-1 form').on('submit', function (e) {
    e.preventDefault()

    $(this).addClass('disabled')

    var deposit = $('#user_deposit').val()

    callbacks.onSetDeposit(deposit)
  })

  $('form.step-2').on('submit', function (e) {
    e.preventDefault()

    $(this).addClass('disabled')

    var user_bet = $('#user_bet').val()
    var user_num = $('#user_num').val()

    callbacks.onRoll(user_bet, user_num)

    setTimeout(function () {
      $('form.step-2').removeClass('disabled')
    }, 1500)
  })

  $('form.step-3').on('submit', function (e) {
    e.preventDefault()

    callbacks.onEndGame()
  })
}

function renderGames (history) {
  if (typeof Game === 'undefined') {
    window.Game = window.Dice.logic
  }

  history = history || Game.history
  var ghtml = ''
  for (var k in history) {
    var g = history[k]
    ghtml += '<tr><td>' + g.user_bet + '</td><td>' + g.user_num + '</td><td><span class="hash">' + g.random_hash + '</span></td><td>' + g.random_num + '</td><td>' + g.profit + '</td></tr>'
  }

  ghtml = '<table><thead><tr><th>bet</th><th>num</th><th>hash</th><th>random</th><th>profit</th></tr></thead><tbody>' + ghtml + '</tbody><tfoot><tr><th colspan="5">Game Balance: ' + Game.payChannel.getBalance() + '</th></tr></tfoot></table>'

  $('#games_list').html(ghtml)
}
