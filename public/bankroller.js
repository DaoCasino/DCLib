/* global DCLib fetch */

function getGameContract (callback) {
  // ropsten contarct address and abi
  let gameContract = {
    address: '0x004326284c6c5882bdb511484cafc82dc58f9c78',
    abi: JSON.parse('[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"disputes","outputs":[{"name":"disputeSeed","type":"bytes32"},{"name":"disputeBet","type":"uint256"},{"name":"initiator","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_session","type":"uint256"},{"name":"_disputeBet","type":"uint256"},{"name":"_gameData","type":"uint256[]"},{"name":"_disputeSeed","type":"bytes32"},{"name":"_sign","type":"bytes"}],"name":"openDispute","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_N","type":"bytes"},{"name":"_E","type":"bytes"},{"name":"_rsaSign","type":"bytes"}],"name":"closeDispute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_sigseed","type":"bytes"},{"name":"_min","type":"uint256"},{"name":"_max","type":"uint256"}],"name":"createRnd","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"channels","outputs":[{"name":"open","type":"bool"},{"name":"player","type":"address"},{"name":"bankroller","type":"address"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollerBalance","type":"uint256"},{"name":"bankrollerDeposit","type":"uint256"},{"name":"session","type":"uint256"},{"name":"endBlock","type":"uint256"},{"name":"RSAHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"E","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"h","type":"bytes32"},{"name":"signature","type":"bytes"}],"name":"recoverSigner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"}],"name":"closeByDispute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_playerBalance","type":"uint256"},{"name":"_bankrollerBalance","type":"uint256"},{"name":"_session","type":"uint256"},{"name":"_close","type":"bool"},{"name":"_sign","type":"bytes"}],"name":"closeByConsent","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_playerBalance","type":"uint256"},{"name":"_bankrollerBalance","type":"uint256"},{"name":"_session","type":"uint256"},{"name":"_sign","type":"bytes"}],"name":"updateChannel","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"developer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"},{"name":"_player","type":"address"},{"name":"_bankroller","type":"address"},{"name":"_playerBalance","type":"uint256"},{"name":"_bankrollerBalance","type":"uint256"},{"name":"_session","type":"uint256"},{"name":"_time","type":"uint256"},{"name":"_gameData","type":"uint256[]"},{"name":"_N","type":"bytes"},{"name":"_E","type":"bytes"},{"name":"_sign","type":"bytes"}],"name":"openChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"safeTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"bytes32"}],"name":"closeByTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_token","type":"address"},{"name":"_ref","type":"address"},{"name":"_gameWL","type":"address"},{"name":"_playerWL","type":"address"},{"name":"_rsa","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"playerBalance","type":"uint256"},{"indexed":false,"name":"bankrollerBalance","type":"uint256"},{"indexed":false,"name":"session","type":"uint256"}],"name":"logChannel","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"initiator","type":"address"},{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"session","type":"uint256"},{"indexed":false,"name":"seed","type":"bytes32"}],"name":"logDispute","type":"event"},{"constant":true,"inputs":[{"name":"_gameData","type":"uint256[]"},{"name":"_bet","type":"uint256"}],"name":"checkGameData","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_gameData","type":"uint256[]"},{"name":"_bet","type":"uint256"},{"name":"_rnd","type":"uint256"}],"name":"game","outputs":[{"name":"_win","type":"bool"},{"name":"_amount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]')
  }

  if (process.env.DC_NETWORK !== 'local') {
    callback(gameContract)
    return
  }

  fetch('http://127.0.0.1:8181/?get=contract&name=Dice').then(function (res) {
    return res.json()
  }).then(function (localGameContract) {
    callback({
      address:localGameContract.address,
      abi: JSON.parse(localGameContract.abi)
    })
  })
}

(function () {
  getGameContract(function (gameContract) {
    return new DCLib.DApp({
      slug     : 'dicetest_v42',
      contract : gameContract,
      rules    : {
        depositX:2
      }
    })
  })
})()
