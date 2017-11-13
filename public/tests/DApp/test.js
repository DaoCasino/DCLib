const assert = chai.assert

const GameLogic = function () {
    var balance = 1
    var history = []

    var setBalance = function (deposit) {
        balance = deposit * 1
    }

    var getBalance = function () {
        return balance
    }

    var Roll = function (user_bet, user_num, random_hash) {
        let profit = -user_bet

        const random_num = DCLib.Utils.bigInt(random_hash, 16).divmod(65536).remainder.value

        if (user_num > random_num) {
            profit = (user_bet * (65536 - 1310) / user_num) - user_bet
        }
        if (user_num == random_num) {
            profit = user_bet
        }

        balance += profit * 1

        const roll_item = {
            timestamp: new Date().getTime(),
            user_bet: user_bet,
            profit: profit,
            user_num: user_num,
            balance: balance,
            random_hash: random_hash,
            random_num: random_num,
        }
        history.push(roll_item)

        return roll_item
    }

    return {
        setBalance: setBalance,
        getBalance: getBalance,
        roll: Roll,
        history: history,
    }
}

    
describe('DApp', () => {

    it('Create', () => {
        window.MyDApp = new DCLib.DApp({
            code: 'dicegame_v2', // unique DApp code
            logic: GameLogic, // inject logic constructor in your DApp
        })
    })
    
    it('Connect: DCLib.Dapp.connect()', function () {
        window.MyDApp.connect()
    })

    it('openChannel', () => {
        assert( typeof window.MyDApp.openChannel === 'function' )
    }) 

    it('Call', () => {
        assert(typeof window.MyDApp.call === 'function')
    })

    it('Disconnect', () => {
        assert(typeof window.MyDApp.disconnect === 'function')
    })

    it('Close channel', () => {
        assert(typeof window.MyDApp.closeChannel === 'function')
    })

    it('Request', () => {
        assert(typeof window.MyDApp.request === 'function')
    })

    it('Response', () => {
        assert(typeof window.MyDApp.response === 'function')
    })

    it('Find bankroller', () => {
        window.MyDApp.findBankroller()
    })

})
