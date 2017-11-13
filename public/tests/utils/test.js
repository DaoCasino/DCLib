const assert = chai.assert

const inputArr = ['Hello world', 'my name is Ilya', 'i am from Russia', 'i love blockchain']
const outputArr = []
const add0xresult = []

for (let i = 0; i < inputArr.length; i++) {
    const checksum = DCLib.Account.sign(inputArr[i]).messageHash
    outputArr.push(checksum)
}


describe('Utils', () => {

    describe('Convertation bets and dec', () => {

        it('Decimal to bets: DCLib.Utils.bet2dec(val, r)', () => {

            console.groupCollapsed('bet2dec')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(1000000000) * 1000000000)
                    const r = Math.floor(Math.random(5) * 10)
                    const bet2dec = DCLib.Utils.bet2dec(val, r)
                    console.log(`${val} Bets decimal format in human format: ${bet2dec}`)
                }
            console.groupEnd()

        })

        it('Bets to decimal: DCLib.Utils.bet4dec(val)', () => {

            console.groupCollapsed('bet4dec')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(100) * 10)
                    const bet4dec = DCLib.Utils.bet4dec(val)
                    console.log(`${val} Bets human format in decimal format: ${bet4dec}`)
                }
            console.groupEnd()

        })

    })

    describe('Transform to sha3 format', () => {

        it('String value turn sha3 format: DCLib.Utils.checksum(string)', () => {

            console.groupCollapsed('checksum')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(100000000) * 100000000).toString()
                    const checksum = DCLib.Utils.checksum(val)
                    console.log(`${val} to String in sha3 format: ${checksum}`)
                }
            console.groupEnd()

        })

        it('Translate to sha3 format and truncates value: DCLib.Utils.hashName(name)', () => {

            console.groupCollapsed('hashName')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(100000000) * 100000000).toString()
                    const hashName = DCLib.Utils.hashName(val)
                    console.log(`${val} to String in sha3 format truncates: ${hashName}`)
                }
            console.groupEnd()

        })

    })

    describe('Transform num', () => {

        it('Change the position of the comma after 1 character by the set value: DCLib.Utils.toFixed(value, precision)', () => {

            console.groupCollapsed('toFixed')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(100000000) * 100000000)
                    const per = Math.floor(Math.random(5) * 10)
                    const toFixed = DCLib.Utils.toFixed(`0.${val}`, per)
                    console.log(`change the position comma before 1 character ${val}: ${toFixed}`)
                }
            console.groupEnd()

        })

        it('Method add quantity 0 that must be set before the value: DCLib.Utils.pad(num, size)', () => {

            console.groupCollapsed('pad')
                for (let i = 0; i < 5; i++) {
                    const num = Math.floor(Math.random(10) * 10)
                    const size = Math.floor(Math.random(10) * 10)
                    const pad = DCLib.Utils.pad(num, size)
                    console.log(`${num} + ${size} 0 after: ${pad}`)
                }
            console.groupEnd()

        })

    })

    describe('Turn num, hex and string', () => {

        it('Turn num in hex format: DCLib.Utils.numToHex(num)', () => {

            console.groupCollapsed('numToHex')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(1000000000000) * 1000000000000)
                    const numToHex = DCLib.Utils.numToHex(val)
                    console.log(`${val} to Number format in Hex format: ${numToHex}`)
                }
            console.groupEnd()

        })

        it('Turn hex in num format: DCLib.Utils.hexToNum(str)', () => {

            console.groupCollapsed('hexToNum')
                for (let i = 0; i < 5; i++) {
                    const val = Math.floor(Math.random(1000000000000) * 1000000000000)
                    const hexVal = `0x${val}ddwqf${val}`
                    const hexToNum = DCLib.Utils.hexToNum(hexVal)
                    console.log(`${hexVal} to Number format in Hex format: ${hexToNum}`)
                }
            console.groupEnd()

        })

        it('Convert hex String to String format: DCLib.Utils.hexToString(hex)', () => {

            console.groupCollapsed('hexToString')
                for (let i = 0; i < outputArr.length; i++) {
                    const hexToString = DCLib.Utils.hexToString(outputArr[i])
                    console.log(`${outputArr[i]} in string format: ${hexToString}`)
                }
            console.groupEnd()

        })

    })

    describe('Change 0x', () => {
        
        it('Add 0x: DCLib.Utils.add0x(str)', function () {

            console.groupCollapsed('Add 0x to string')
                for (let i = 0; i < 5; i++) {
                    const str = Math.floor(Math.random(100000000) * 100000000).toString()
                    const add0x = DCLib.Utils.add0x(str)
                    add0xresult.push(add0x)
                }
            console.groupEnd()

        })

        it('Remove 0x: DCLib.Utils.remove0x(str)', function () {
            
            console.groupCollapsed('Remove 0x to string')
                for (let i = 0; i < add0xresult.length; i++) {
                    const remove0x = DCLib.Utils.remove0x(add0xresult[i]) 
                }
            console.groupEnd()

        })

    })

    describe('Buff', () => {
        
        it('Buf2hex: DCLib.Utils.buf2hex(buff)', function () {
            
            console.groupCollapsed('Buff to hex')
                for (let i = 0; i < 5; i++) {
                    const buff = Math.floor(Math.random(100) * 100)
                    const buf2hex = DCLib.Utils.buf2hex(buff) 
                    console.log(buf2hex)  
                }

                for (let g = 0; g < 5; g++) {
                    const buff = Math.floor(Math.random(100) * 100).toString()
                    const buf2hex = DCLib.Utils.buf2hex(buff)
                    console.log(buf2hex)
                }

                for (let j = 0; j < inputArr.length; j++) {
                    const buf2hex = DCLib.Utils.buf2hex(inputArr[j])
                    console.log(buf2hex)
                }
            console.groupEnd()

        })

        it('Buf2bytes32: DCLib.Utils.buf2bytes32(buff)', function () {
            console.groupCollapsed('Buff to bytes32')
                for (let i = 0; i < 5; i++) {
                    const buff = Math.floor(Math.random(100) * 100)
                    const buf2bytes32 = DCLib.Utils.buf2bytes32(buff)
                    console.log(buf2bytes32)
                }

                for (let g = 0; g < 5; g++) {
                    const buff = Math.floor(Math.random(100) * 100).toString()
                    const buf2bytes32 = DCLib.Utils.buf2bytes32(buff)
                    console.log(buf2bytes32)
                }

                for (let j = 0; j < inputArr.length; j++) {
                    const buf2bytes32 = DCLib.Utils.buf2bytes32(inputArr[j])
                    console.log(buf2bytes32)
                }
            console.groupEnd()
        })

    })

    describe('Make seed', () => {
        
        it('Make seed: DCLib.Utils.makeSeed()', () => {
            const makeSeed = DCLib.Utils.makeSeed()
            console.log('Make seed: ', makeSeed)
        })

    })

    describe('Concat to array', () => {
        
        it('concatUint8Array: DCLib.Utils.concatUint8Array(buffer1, buffer2)', () => {
            const concatUint8Array = DCLib.Utils.concatUint8Array('0.00000032', '0.22222')
            console.log('concatUint8Array: ', concatUint8Array)
        })

    })


})