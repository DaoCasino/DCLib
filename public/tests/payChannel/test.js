const assert = chai.assert

DCLib.defineDAppLogic('dicegame_v2', function () {
    
    console.log('GameLogic')

})

window.MyDApp = new DCLib.DApp({
    code: 'dicegame_v2',
})

describe('Pay channel', () => {
    
    describe('Set', () => {

        it('Set deposit', () => {
            const setDeposit = window.MyDApp.logic.payChannel.setDeposit(1)
            console.log('Function setDeposit: ',setDeposit)
        })
        
    })

    describe('Get', () => {
        
        it('Get deposit', () => {
            
            const getDeposit = window.MyDApp.logic.payChannel.getDeposit()
            console.log('Function getDeposit: ',getDeposit)

        })

        it('Get balance', () => {
            
            const getBalance = window.MyDApp.logic.payChannel.getBalance()
            console.log('Function getBalance: ', getBalance)

        })

        it('Get profit', () => {

            const getProfit = window.MyDApp.logic.payChannel.getProfit()
            console.log(getProfit)
        
        })

    })

    describe('Other function', () => {
        
        it('Add TX', () => {
            
            const addTX = window.MyDApp.logic.payChannel.addTX(3, 2)
            console.log('Function addTX: ', addTX)

        })

        it('Print log', () => {

            window.MyDApp.logic.payChannel.printLog()

        })

        it('Reset', () => {
            
            const reset = window.MyDApp.logic.payChannel.reset()
            console.log('Function reset: ', reset)

        })

    })





})