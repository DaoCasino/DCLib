import debug from 'debug'

const logInfo = debug('dclib:info')

export default function (DCLib) {
  logInfo('%c DCLib (DApps API) v ' + DCLib.version + ' - initialized', 'background:#333; color:#d99736; padding:5px 10px; ')

  logInfo(' >>> README <<< ')

  logInfo('%c Full documentation here https://daocasino.readme.io/',
    'background: #333; color: #bada55; padding:5px')

  logInfo('\n\nUse DCLib like this:\n')
  logInfo('%c' +
        '  const myDApp = new DCLib.DApp({})          \n' +
        '  console.log( DCLib.web3.version           )\n' +
        '  console.log( DCLib.Account.get().openkey  )\n' +
        '  console.log( DCLib.Utils                  )'
    ,
  'font-size:12px; background:#ccc; color:#333;'
  )

  logInfo('WEB3')
  logInfo('web3 placed in DCLib.web3, vesrion:', DCLib.web3.version)
  logInfo('docs: £https://github.com/ethereum/web3.js/tree/1.0')

  logInfo('Account')

  logInfo('Eth Lightwallet')
  logInfo('lightwallet placed in DCLib.Account.lib ')
  logInfo('docs: https://github.com/ConsenSys/eth-lightwallet')
}
