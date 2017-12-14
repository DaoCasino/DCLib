# [DCLib](https://github.com/DaoCasino/DCLib) 

DCLib is javascript library for integrate [dao.casino blockchain protocol](https://github.com/DaoCasino/Whitepaper).
Interact with [bankroller](https://github.com/DaoCasino/BankRollerApp), use [Signidice random algorithm](https://github.com/DaoCasino/Whitepaper/blob/master/DAO.Casino%20WP.md#35-algorithm-implemented-in-mvp-of-daocasino-protocol), and paymentchannels.

DCLib has two part:
  * browser/frontend library
  * bankroller side API

DCLIb methods available inside bankroller application. 

IMPORTANT: now lib work only in [ropsten](https://ropsten.etherscan.io/) test network.

# Get startted
[See short video](https://www.youtube.com/watch?v=vD2kI_4IEFA)

[Download and install last BankRollerApp](https://github.com/DaoCasino/BankRollerApp/releases)

[See DApp example](https://github.com/DaoCasino/BankRollerApp/blob/master/DApps/example.zip)


# Use

## Include JS in your DApp
```
<script src="https://platform.dao.casino/api/lib/v2/DC.js"></script>
```
or use npm 
```
npm install --save dclib
```
```
import 'dclib' // or require('dclib')

console.log(DCLib.version)
```

Open it in browser and see console.

<img src="https://raw.githubusercontent.com/DaoCasino/DCLib/master/manual/asset/console.log.init.png">


# Docs
[Tutorials](https://daocasino.readme.io/v2.0/docs/overview)

[More about DApps](https://github.com/DaoCasino/BankRollerApp/tree/master/DApps)

[[RU] Minimal Game](https://daocasino.readme.io/v2.0/docs/minimum-viable-game)

[DCLib References](https://ipfs.infura.io/ipfs/QmRYB24gqeuYHqFm2q48BmnFejL6P2mJtsjzvcjLB6MDm4)

