/* eslint-disable indent */
/* global fetch $ DCLib Game MyDApp */

$(document).ready(function () {
  // Create our DApp
  DCLib.on('ready', function () {
    DCLib.Account.initAccount()

    function getGameContract (callback) {
      fetch('http://127.0.0.1:8181/?get=contract&name=Dice').then(function (res) {
        return res.json()
      }).then(function (localGameContract) {
        callback({
          address:localGameContract.address,
          abi: JSON.parse(localGameContract.abi)
        })
      }).catch(function (params) {
        console.clear()
        callback(false)
      })
    }

    getGameContract(function (gameContract) {
      window.MyDApp = new DCLib.DApp({
        slug: 'dicetest_v32',
        contract: gameContract,
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
  MyDApp.connect({
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

  MyDApp.Game(user_bet, user_num, random_hash)
  .then(function (res, advanced) {
      console.log('result', res)
      console.log('advanced', advanced)

      renderGames()
      var ubets = Game.payChannel.getBalance()
      $('#user_bet').max = ubets
    },

    // log
    function (log) {
      $('#play_log').append('<div> >> ' + log + '</div>')
    }
  )
}

function endGame () {
  MyDApp.disconnect(function (res) {
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

  $('#user_address').html('<a target="_blank" href="https://ropsten.etherscan.io/address/' + DCLib.Account.get().openkey + '">' + DCLib.Account.get().openkey + '</a>')
  $('#faucet').attr('href', 'https://platform.dao.casino/faucet?to=' + DCLib.Account.get().openkey)

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
    window.Game = MyDApp.logic
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
