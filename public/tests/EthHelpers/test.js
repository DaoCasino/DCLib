const assert = chai.assert

describe('Balance', () => {

    it('DCLib.Eth.getBalances(address)', function () {

        const address = JSON.parse(localStorage.web3wallet).address
        const getBalances = DCLib.Eth.getBalances(address)
        console.groupCollapsed('All balance')
        console.log(getBalances)
        console.groupEnd()

    })

    it('DCLib.Eth.getEthBalance(address)', function () {

        const address = JSON.parse(localStorage.web3wallet).address
        const getEthBalance = DCLib.Eth.getEthBalance(address)
        console.groupCollapsed('Eth balance')
        console.log(getEthBalance)
        console.groupEnd()
        
    })

    it('DCLib.Eth.getBetBalace(address)', function () {

        const address = JSON.parse(localStorage.web3wallet).address
        const getBetBalance = DCLib.Eth.getBetBalance(address)
        console.groupCollapsed('Bet balance')
        console.log(getBetBalance)
        console.groupEnd()
        
    })

})

describe('ERC20 approve', () => {
    
    it('DCLib.Eth.ERC20approve(spender, amount)', function () {

        const address = JSON.parse(localStorage.web3wallet).address
        const ERC20approve = DCLib.Eth.ERC20approve(address, 0)
        console.groupCollapsed('ERC20 approve')
        console.log(ERC20approve)
        console.groupEnd()
        
    })

})