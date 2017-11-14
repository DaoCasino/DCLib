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

describe('GameLogic', () => {

    describe('GameLogic create and start', () => {

        it('Create', () => {
            window.MyDApp = new DCLib.DApp({
                code: 'dicegame_v2',
            })
        })

        it('Started', () => {
            window.MyDApp = new GameLogic()
            console.table(MyDApp)
            console.log('Started true')
        })

    })

    describe('GameLogic vars & functions ', () => {

        it('History', () => {
            assert((!!window.MyDApp.history))
            console.log(window.MyDApp.history)
        })

        it('Roll', () => {
            assert((typeof window.MyDApp.roll === 'function'))
            console.log('Roll working')
        })

    })

    describe('Roll function', () => {
        
        it('Proffit', () => {
            console.groupCollapsed('Proffit')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const profit = window.MyDApp.roll(userBet, userNum, randHash).profit
                    console.log('Proffit: ', profit)
                }
            console.groupEnd()
        })

        it('Timestamp', () => {
            console.groupCollapsed('Timestamp')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const timestamp = window.MyDApp.roll(userBet, userNum, randHash).timestamp
                    console.log('Timestamp: ', timestamp)
                }
            console.groupEnd()
        })

        it('User bet', () => {
            console.groupCollapsed('User bet')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const user_bet = window.MyDApp.roll(userBet, userNum, randHash).user_bet
                    console.log('User bet: ', user_bet)
                }
            console.groupEnd()
        })

        it('User num', () => {
            console.groupCollapsed('User num')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const user_num = window.MyDApp.roll(userBet, userNum, randHash).user_num
                    console.log('User num: ', user_num)
                }
            console.groupEnd()
        })

        it('Balance', () => {
            console.groupCollapsed('Balance')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const balance = window.MyDApp.roll(userBet, userNum, randHash).balance
                    console.log('Balance: ', balance)
                }
            console.groupEnd()
        })

        it('Random hash', () => {
            console.groupCollapsed('Random hash')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const random_hash = window.MyDApp.roll(userBet, userNum, randHash).random_hash
                    console.log('Random hash: ', random_hash)
                }
            console.groupEnd()
        })

        it('Random num', () => {
            console.groupCollapsed('Random num')
                for (let i = 0; i < 5; i++) {
                    const userBet = Math.floor(Math.random(10) * 10)
                    const userNum = Math.floor(Math.random(100000) * 100000)
                    const randHash = Math.floor(Math.random(1000000000000000) * 1000000000000000).toString()
                    const random_num = window.MyDApp.roll(userBet, userNum, randHash).random_num
                    console.log('Random num: ', random_num)
                }
            console.groupEnd()
        })

    })
})