// @ts-nocheck

import { deflate, undeflate } from './shared-util.js'

const anyCfg = [
    [0, x => x === null,            () => tc.null()],
    [1, x => x === undefined,       () => tc.undefined()],
    [2, x => typeof x == 'number',  () => tc.number()],
    [3, x => typeof x == 'string',  () => tc.string()],
    [4, x => typeof x == 'boolean', () => tc.boolean()],
    [5, x => x instanceof Array,    () => varArray(tc.any())],
    [6, x => typeof x === 'object', () => tc.object()]
]
const numt = arrt => function() {
    return [(arr, val) => {
        arr.push(...new Uint8Array(new arrt([val]).buffer))
    }, (arr, args) => {
        const bpe = arrt.BYTES_PER_ELEMENT
        args.push(new arrt(new Uint8Array(Array(bpe).fill().map((_, i) => arr.slice(0, bpe)[i] ?? 0)).buffer)[0] ?? 0)
        return arrt.BYTES_PER_ELEMENT
    }]
}
function array_(types) {
    return [(arr, val) => {
        for (let i = 0; i < types.length; ++i) {
            const maker = types[i][0]
            maker(arr, val[i])
        }
    }, (arr, args) => {
        let eaten = 0
        let args_ = []
        for (const type of types) {
            const eater = type[1]
            eaten += eater(arr.subarray(eaten), args_)
        }
        args.push(args_)
        return eaten
    }]
}
function struct(entries) {
    return [(arr, val) => {
        if (val == undefined) return
        const vs = val instanceof Array ? val : Object.values(val)
        for (let i = 0; i < entries.length; ++i) {
            const maker = entries[i][1][0]
            maker(arr, vs[i])
        }
    }, (arr, args) => {
        let eaten = 0
        let args_ = []
        for (const entry of entries) {
            const eater = entry[1][1]
            eaten += eater(arr.subarray(eaten), args_)
        }
        args.push(Object.fromEntries(args_.map((x, i) => [entries[i][0], x])))
        return eaten
    }]
}
function varArray(type) {
    return [(arr, vals) => {
        arr.push(...new Uint8Array(new Uint32Array([vals.length]).buffer))
        for (const val of vals) {
            const maker = type[0]
            maker(arr, val)
        }
    }, (arr, args) => {
        const size = new Uint32Array(new Uint8Array([...arr.subarray(0, 4)]).buffer)[0]
        let eaten = 4
        let args_ = []
        for (let i = 0; i < size; ++i) {
            const eater = type[1]
            eaten += eater(arr.subarray(eaten), args_)
        }
        args.push(args_)
        return eaten
    }]
}
function fixedArray(type, count) {
    return [(arr, val) => {
        for (let i = 0; i < count; ++i) {
            const maker = type[0]
            maker(arr, val?.[i])
        }
    }, (arr, args) => {
        let eaten = 0
        let args_ = []
        for (let i = 0; i < count; ++i) {
            const eater = type[1]
            eaten += eater(arr.subarray(eaten), args_)
        }
        args.push(args_)
        return eaten
    }]
}
const tc = {
    string() {
        return [(arr, val) => {
            arr.push(...new TextEncoder().encode(val), 0)
        }, (arr, args) => {
            let i = arr.findIndex(x => x === 0)
            if (i == -1) {
                args.push(new TextDecoder().decode(arr))
                return arr.length
            }
            args.push(new TextDecoder().decode(arr.subarray(0, i)))
            return i + 1
        }]
    },
    number: numt(Float64Array),
    int8: numt(Int8Array),
    int16: numt(Int16Array),
    int32: numt(Int32Array),
    uint8: numt(Int8Array),
    uint16: numt(Int16Array),
    uint32: numt(Int32Array),
    float32: numt(Float32Array),
    boolean() {
        return [(arr, val) => {
            arr.push(Number(val))
        }, (arr, args) => {
            args.push(Boolean(arr[0] ?? 0))
            return 1
        }]
    },
    null() {
        return [() => {}, (_, args) => {
            args.push(null)
            return 0
        }]
    },
    undefined() {
        return [() => {}, (_, args) => {
            args.push(undefined)
            return 0
        }]
    },
    object() {
        return [(arr, vals) => {
            const entries = Object.entries(vals ?? {})
            let transferableCount = 0
            let arr_ = []
            for (const [k, v] of entries) {
                const entry = anyCfg.find(x => x[1](v))
                if (!entry) continue
                ++transferableCount
                arr_.push(entry[0])
                arr_.push(...new TextEncoder().encode(k), 0)
                entry[2]()[0](arr_, v)
            }
            arr.push(...new Uint8Array(new Uint32Array([transferableCount]).buffer), ...arr_)
        }, (arr, args) => {
            const size = new Uint32Array(new Uint8Array([...arr.subarray(0, 4)]).buffer)[0]
            let eaten = 4
            let obj = {}
            for (let i = 0; i < size; ++i) {
                let subarr 
                
                subarr = arr.subarray(eaten)
                const a = subarr
                const entry = anyCfg.find(x => x[0] == a[0])
                if (!entry) throw new Error('Malformed message arrived')
                eaten += 1
                subarr = arr.subarray(eaten)
                let n = subarr.findIndex(x => x === 0)
                const key = new TextDecoder().decode(subarr.subarray(0, n))
                eaten += n + 1
                subarr = arr.subarray(eaten)
                const args_ = []
                eaten += entry[2]()[1](subarr, args_)
                obj[key] = args_[0]
            }
            args.push(obj)
            return eaten
        }]
    },
    any() {
        return [(arr, val) => {
            const entry = anyCfg.find(x => x[1](val))
            if (!entry) throw new Error("Provided value is of untransferable type, thus can't send it")
            arr.push(entry[0])
            entry[2]()[0](arr, val)
        }, (arr, args) => {
            const entry = anyCfg.find(x => x[0] == (arr[0] ?? 0))
            return 1 + entry[2]()[1](arr.subarray(1), args)
        }]
    }
}

class SYM { constructor(t) { this.t = t }}
const l = t => new Proxy(new SYM(t), { get: (o, n) => n > 0 ? `${t}[${n ?? ''}]` : o[n] })
export const string = l('string'), int8 = l('int32'), int16 = l('int16'), int32 = l('int32'), uint8 = l('uint8'), uint16 = l('uint16'), uint32 = l('uint32'), float32 = l('float32'), number = l('number'), boolean = l('boolean'), object = l('object'), any = l('any')

class Array_ { constructor(t, c) { this.t = t; this.c = c } }
export const array = (t, c) => new Array_(t, c)

class Raw_ { constructor(t) { this.t = t} }
export const raw = t => new Raw_(t)

export function program(pattern) {
    var p = pattern
    if (p === null) return tc.null()
    if (p === undefined) return tc.undefined()
    if (p instanceof SYM) return program(p.t)
    if (p instanceof Array_) {
        const t = program(p.t)
        if (p.c != null) return fixedArray(t, p.c)
        return varArray(t)
    }
    if (p instanceof Raw_) {
        const t = program(p.t)
        return [t[0], (arr, args) => {
            const i = t[1](arr, [])
            args.push(arr.subarray(0, i))
            return i
        }]
    }
    if (p instanceof Array) return array_(p.map(program))
    if (typeof p === 'object') return struct(Object.entries(p).map(x => [x[0], program(x[1])]))
    p = `${pattern}`
    const t = tc[p]
    if (t) return t()
    if (p.endsWith('[]')) return varArray(program(p.slice(0, -2)))
    const m2 = p.match(/(.*)\[(\d+)\]$/)
    if (m2) return fixedArray(program(m2[1]), Number(m2[2]))
}

export default function (type, settings) {
    const compress = settings?.compress ?? false
    const s = program(type)
    return {
        async serialize(val) {
            const arr = []
            s[0](arr, val)
            if (arr.length > 0) {
                let i = arr.length - 1
                for (; i >= 0 && arr[i] == 0; --i);
                if (i != arr.length - 1) arr.splice(i + 1)
            }
            let res = new Uint8Array(arr)
            if (compress) res = await deflate(res)
            return res
        },
        async deserialize(bytes) {
            if (compress) bytes = await undeflate(bytes)
            const vals = []
            s[1](bytes, vals)
            return vals[0]
        }
    }
}