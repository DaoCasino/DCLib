const assert = chai.assert

DCLib.defineDAppLogic('dicegame_v2', function () {
    const _self = this

    const MAX_RAND_NUM = 65536
    const HOUSEEDGE = 0.02 // 2%

    let history = []

    var Roll = function (user_bet, user_num, random_hash) {
        // convert 1BET to 100000000
        user_bet = DCLib.Utils.bet2dec(user_bet)

        // generate random number
        const random_num = DCLib.numFromHash(random_hash, 0, 65536)

        let profit = -user_bet
        // if user win
        if (user_num >= random_num) {
            profit = (user_bet * (MAX_RAND_NUM - MAX_RAND_NUM * HOUSEEDGE) / user_num) - user_bet
        }

        // add result to paychannel
        _self.payChannel.addTX(profit)
        _self.payChannel.printLog()

        // push all data to our log
        // just for debug 
        const roll_item = {
            timestamp: new Date().getTime(),
            user_bet: user_bet,
            profit: profit,
            user_num: user_num,
            balance: _self.payChannel.getBalance(),
            random_hash: random_hash,
            random_num: random_num,
        }
        history.push(roll_item)

        return roll_item
    }

    return {
        roll: Roll,
        history: history,
    }
})

    
describe('DApp', () => {

    it('Create', () => {
        window.MyDApp = new DCLib.DApp({
            code: 'dicegame_v2', // unique DApp code
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
