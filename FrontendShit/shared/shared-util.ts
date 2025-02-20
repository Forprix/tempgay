// @ts-nocheck

const fromCharCode = String.fromCharCode
const asCharCode = c => c.charCodeAt(0)

// General
export const sleep = s => new Promise(res => setTimeout(res, s * 1000))
export const isObject = v => v != null && typeof v === 'object'
export const objectsEqual = (object1, object2) => {
    if (!isObject(object1) || !isObject(object2)) return object1 === object2
    
    const keys1 = Object.keys(object1)
    const keys2 = Object.keys(object2)
  
    if (keys1.length !== keys2.length) return false
  
    for (const key of keys1) {
        const val1 = object1[key]
        const val2 = object2[key]
        const areObjects = isObject(val1) && isObject(val2)
        if (areObjects && !objectsEqual(val1, val2)) return false
        if (!areObjects && val1 !== val2) return false
    }
  
    return true
}
export const objectEmpty = (object) => {
    return isObject(object) && Object.keys(object).length == 0
}
export const loop = async cb => {
    while (true)
        await cb()
}
export function autoNew<T extends new (...args: any[]) => any>(v: T): InstanceType<T>  {
    return function(...args) { return new v(...args) }
}


// Compression
export const deflate = async (input) => {
    const cs = new CompressionStream('deflate')
    const writer = cs.writable.getWriter()
    writer.write(input)
    writer.close()
    const output = []
    const reader = cs.readable.getReader()
    let totalSize = 0
    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        output.push(value)
        totalSize += value.byteLength
    }
    const concatenated = new Uint8Array(totalSize)
    let offset = 0
    for (const array of output) {
      concatenated.set(array, offset)
      offset += array.byteLength
    }
    return concatenated
}
export const undeflate = async (input) =>{
    const ds = new DecompressionStream('deflate')
    const writer = ds.writable.getWriter()
    writer.write(input)
    writer.close()
    const output = []
    const reader = ds.readable.getReader()
    let totalSize = 0
    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        output.push(value)
        totalSize += value.byteLength
    }
    const concatenated = new Uint8Array(totalSize)
    let offset = 0
    for (const array of output) {
        concatenated.set(array, offset)
        offset += array.byteLength
    }
    return concatenated
}
export const base64 = function encode(uint8array) {
    const output = []
    for (let i = 0, length = uint8array.length; i < length; i++)
      output.push(fromCharCode(uint8array[i]))
    return btoa(output.join(''))
}
export const unbase64 = function decode(chars) {
    return Uint8Array.from(atob(chars), asCharCode)
}


// Math
/**
 * @param {number} t 
 * @param {number} start 
 * @param {number} end 
 * @returns {number}
*/
export const lerp = (t, start, end) => {
    return start + t * (end - start)
}
export const sat = num => num > 1 ? 1 : num < 0 ? 0 : num
export const { floor, ceil, round, max, min, sign, sqrt, abs, PI, cos, sin, atan2, hypot, random: random_ } = Math
export const clamp = (v, lowerLimit, upperLimit) => v < lowerLimit ? lowerLimit : v > upperLimit ? upperLimit : v
export const random = (limit1, limit2) => {
    if (limit1 == null) return random_()
    if (limit2 == null) return random_() * limit1
    let lowerLimit, upperLimit
    if (limit1 < limit2)
        [lowerLimit, upperLimit] = [limit1, limit2]
    else
        [lowerLimit, upperLimit] = [limit2, limit1]
    return lowerLimit + random_() * (upperLimit - lowerLimit)
}


// Events
export const eventify = (target, events) => {
    const els = new Map(events.map(x => [x, new Set]))
    target.on = function(eventType, listener) {
        const l = els.get(eventType)
        if (!l) throw Error(`Unsupported event: '${eventType}'`)
        l.add(listener)
        return this
    }
    target.once = function(eventType, listener) {
        const f = () => (listener(), els.get(eventType).delete(f))
        return target.on(eventType, f)
    }
    target.off = function(eventType, listener) {
        const l = els.get(eventType)
        if (!l) throw Error(`Unsupported event: '${eventType}'`)
        els.get(eventType).delete(listener)
        return this
    }
    return async function(eventType, ...eventData) {
        const ls = els.get(eventType)
        const s = ls.size
        const ps = Array(s)
        let i = 0
        for (const l of ls) ps[i++] = l(...eventData)
        await Promise.all(ps)
        return this
    }
}

// SmartMap
export const SmartMap = autoNew(class SmartMap {
    #k; #h; #m
    constructor(keyMapper, keyUnmapper) {
        this.#k = keyMapper ?? (x => x)
        this.#h = keyUnmapper ?? (x => x)
        this.#m = new Map
    }
    get(key) {
        return this.#m.get(this.#k(key))
    }
    getOrSet(key, defaultValueGetter) {
        key = this.#k(key)
        if (this.#m.has(key)) return this.#m.get(key)
        const newValue = defaultValueGetter()
        this.#m.set(key, newValue)
        return newValue
    }
    pop(key) {
        key = this.#k(key)
        const v = this.#m.get(k)
        return (this.#m.delete(k), v)
    }
    set(key, value) {
        return this.#m.set(this.#k(key), value)
    }
    has(key) {
        return this.#m.has(this.#k(key))
    }
    delete(key) {
        return this.#m.delete(this.#k(key))
    }
    *clear() {
        const vals = [...this]
        this.#m.clear()
        for (const v of vals)
            yield v
    }
    get size() {
        return this.#m.size
    }
    *entries() {
        for (const [k, v] of this.#m.entries())
            yield [this.#h(k), v]
    }
    *[Symbol.iterator]() {
        for (const [k, v] of this.#m)
            yield [this.#h(k), v]
    }
    *keys() {
        for (const k of this.#m.keys())
            yield this.#h(k)
    }
    *values() {
        for (const v of this.#m.values())
            yield v
    }
    *internalEntries() {
        yield* this.#m.entries()
    }
    *internalKeys() {
        yield* this.#m.keys()
    }
    forEach(cb, thisArg) {
        const f = cb.bind(thisArg)
        for (const [k, v] of this) f(v, k, this)
    }
})
export const SmartSet = autoNew(class SmartSet {
    #k; #h; #m
    constructor(keyMapper, keyUnmapper) {
        this.#k = keyMapper ?? (x => x)
        this.#h = keyUnmapper ?? (x => x)
        this.#m = new Set
    }
    add(key) {
        return this.#m.add(this.#k(key))
    }
    has(key) {
        return this.#m.has(this.#k(key))
    }
    delete(key) {
        return this.#m.delete(this.#k(key))
    }
    *clear() {
        const vals = [...this]
        this.#m.clear()
        for (const v of vals)
            yield v
    }
    get size() {
        return this.#m.size
    }
    *entries() {
        for (const v of this.#m.values()) {
            const x = this.#h(v)
            yield [x, x]
        }
    }
    *[Symbol.iterator]() {
        for (const v of this.#m)
            yield this.#h(v)
    }
    *values() {
        for (const v of this.#m.values())
            yield this.#h(v)
    }
    *internalEntries() {
        yield* this.#m.entries()
    }
    *internalValues() {
        yield* this.#m.values()
    }
    forEach(cb, thisArg) {
        const f = cb.bind(thisArg)
        for (const v of this) f(v, v, this)
    }
})

const performance_now = performance.now.bind(performance)
export const time = () => performance_now() / 1000
export const Elapser = autoNew(class Elapser {
    #startTime
    constructor() {
        this.#startTime = time()
    }
    start() {
        this.#startTime = time()
    }
    get elapsed() {
        return (time()) - this.#startTime
    }
})


// forEach