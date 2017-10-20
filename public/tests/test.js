const testLogic = function () {
  const 
    a = 2,
    b = 3;

  this.setA = function (coun) { 
    return a = coun;
  }

  this.getA = function () {
    return a;
  }

  return this;
}


describe('Account',  () => {
  describe('Info', () => {
    it('Account info', () => {
      DCLib.Account.info(function(info){
        console.table(info)
      })
    })
  })
})

describe("Dapp", function() {
  
  describe("Create", function() { 
    
    it(`DApp Create`, () => {
      // Create our DApp
      window.MyDApp = new DCLib.DApp({
        code  : 'dicegame_v2' , // unique DApp code
        logic : testLogic     , // inject logic constructor in your DApp
      })
    }) 
    
    it (`logic hash exist`, () => {  
      assert( (!!MyDApp.hash) )
    })
    
  })

  describe('Connection', () => {
    it(`DApp connection`, () => {
      MyDApp.connect({ bankroller : 'auto'},
        function(result) {
          console.log(result)
        }
      )
    })
  })
});

