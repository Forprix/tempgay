// @ts-nocheck
import { sin, cos, floor, random } from './util.js'

interface Class<T> {
    setter(instSetName: string, creatorName: string, handler: (instance: T, ...args : any[]) => any): Class<T>
    setter(sourceTypeName: string, handler: (instance: T, ...args : any[]) => any): Class<T>
    setter(handler: (instance: T, ...args : any[]) => any): Class<T>
}

export function Class(): Class<any> {
    const staticProps = new Map
    const classFn = function() { }
    const { prototype } = classFn
    let mainInitFunc
    return {
        setter(...args) {
            var n1, n2, m = false, f, l = args.length
            if (l == 3) [n1, n2, f] = args
            else if (l == 2) {
                const s = args[0][0].toUpperCase() + args[0].slice(1);
                [n1, n2, f] = [`setFrom${s}`, `from${s}`, args[1]]
            }
            else if (l == 1) [n1, m, f] = [`set`, true, args[0]]
            prototype[n1] = function(...args) {
                return (f(this, ...args), this)
            }
            if (n2) staticProps.set(n2, (...args) => (new classFn)[n1](...args))
            if (m) mainInitFunc = f
            return this
        },
        alterer(...args) {
            var n1 = args[0], n2, f, l = args.length
            if (l == 3) {
                n2 = args[1]
                f = args[2]
            }
            else if (l == 2) {
                n2 = n1 + 'ed'
                f = args[1]
            }
            prototype[n1] = function(...args) {
                return (f(this, ...args), this)
            }
            prototype[n2] = function(...args) {
                return this.copy()[n1](...args)
            }
            return this
        },
        copier(f) {
            prototype.copy = function() {
                const o = new classFn
                f(o, this)
                return o
            }
            return this
        },
        build() {
            const r = function(...args) {
                const o = new classFn
                mainInitFunc(o, ...args)
                return o
            }
            for (const [k, v] of staticProps) r[k] = v
            return r
        }
    }
}

const Vec2 = Class()
    .setter((me, x = 0, y = 0) => {
        me.x = x
        me.y = y
    }) // Создаёт Vec2(), new Vec2()
    .setter('angle', (me, angle) => {
        me.x = sin(angle)
        me.y = cos(angle)
    }) // Создаёт Vec2.fromAngle, v.setFromAngle
    .alterer('floor', me => {
        me.x = floor(me.x)
        me.y = floor(me.y)
    }) // Создаёт v.floor, v.floored
    .copier((me, v) => {
        me.x = v.x
        me.y = v.y
    }) // Создаёт v.copy
    .build()
    // .method('copy', (me, v) => Vec2(v.x, v.y))

// TODO: Private vars


console.log((Vec2()).floored())