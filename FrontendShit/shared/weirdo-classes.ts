
export function Class() {
    let prototype = {},
        staticProps = {},
        classFunction
    return {
        creator(...args) {
            let id1, id2, isMain = false, fn
            if (args.length == 3) {
                id1 = args[0]
                id2 = args[1]
                fn = args[2]
            }
            if (args.length == 2) {
                const caption = args[0][0].toUpperCase() + args[0].slice(1)
                id1 = `setFrom${caption}`
                id2 = `from${caption}`
                fn = args[1]
            }
            if (args.length == 1) {
                id1 = `set`
                isMain = true
                fn = args[0]
            }
            prototype[id1] = function(...args) { return (fn(this, ...args), this) }
            if (id2) {
                staticProps[id2] = (...args) => {
                    const o = {}
                    return (fn(o, ...args), o)
                }
            }
            if (isMain) {
                classFunction = function(...args) {
                    const o = {}
                    return (fn(o, ...args), o)
                }
            }
            
            return this
        },
        changer() {

        },
        finish() {
            for (const k in staticProps)
                classFunction[k] = staticProps[k]
            classFunction.prototype = prototype
            return classFunction
        }
    }
}

const Vec2 = Class()
    .creator((me, x = 0, y = 0) => {
        me.x = x
        me.y = y
    })
    .finish()

console.log(Vec2)
// Class()
//     .creator((me, x = 0, y = 0) => {
//         me.x = x
//         me.y = y
//     })
//     .creator('angle', (me, angle) => {
//         me.x = sin(angle)
//         me.y = cos(angle)
//     })
//     .changer('floor', 'floored', me => {
//         me.x = floor(me.x)
//         me.y = floor(me.y)
//     })
//     .method()
//     .build()

// [
//     creator((me, x = 0, y = 0) => {
//         me.x = x
//         me.y = y
//     }), // v.set, new Vec2, Vec2
//     creator('angle', (me, angle) => {
//         me.x = sin(angle)
//         me.y = cos(angle)
//     }), // v.setFromAngle, Vec2.fromAngle
//     changer('floor', 'floored', (me) => {
//         me.x = floor(me.x)
//         me.y = floor(me.y)
//     }), // v.floor, v.floored
// ]