import Dexie from 'dexie'
import 'dexie-observable'

const DB = new Dexie('DC')
DB.version(1).stores({
  keyval: 'key, val'
})

export default new class Store {
  constructor () {
    this.prefix = 'window: '
    if (typeof window === 'undefined') this.prefix = 'WORKER: '

    this.items = {}
    this.DB    = DB

    DB.on('changes', () => { this.syncData() })
    DB.open()

    if (typeof window !== 'undefined' && window.localStorage) {
      this.items = window.localStorage
    } else {
      this.syncData()
    }
  }

  syncData () {
    DB.keyval.toArray(arr => {
      for (let k in arr) {
        const i = arr[k]
        this.items[i.key] = i.val
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(i.key, i.val)
      }
    })
  }

  async set (key, val, encode = true) {
    if (encode) val = JSON.stringify(val)

    await DB.keyval.put({
      key: key,
      val: val
    })
  }

  async get (key, decode = true) {
    let res = await DB.keyval.get(key)
    if (!res) return null

    if (decode) res.val = JSON.parse(res.val)
    return res.val
  }

  // localStorage compatability
  async setItem (key, val) {
    this.items[key] = val
    await this.set(key, val, false)
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, val)
  }

  getItem (key) {
    return this.items[key] || null
  }
}()
