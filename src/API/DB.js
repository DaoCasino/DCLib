import Dexie from 'dexie'

const DB = new Dexie('DC')
DB.version(1).stores({
  keyval: 'key, val'
})

export default new class Store {
  constructor () {
    this.DB    = DB
    this.items = {}

    if (typeof window !== 'undefined' && window.localStorage) {
      this.items = window.localStorage
    } else {
      DB.keyval.each(i => {
        this.items[i.key] = i.val
      })
    }
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
  setItem (key, val) {
    this.items[key] = val
    this.set(key, val, false)
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, val)
  }

  getItem (key) {
    return this.items[key] || null
  }
}()
