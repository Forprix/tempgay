// @ts-nocheck
import Engine from './engine.js'

export default class {
    #engine
    constructor() {
        const engine = this.#engine = new Engine('.game', [
            ['webgl2', 'visible', { premultipliedAlpha: false, alpha: false }]
        ], {
            hidden: true
        }).preventDefault({
            rmb: true,
            mb3: true,
            mb4: true,
            zoom: true
        })
        
        engine.show()
    }
    get engine() { return this.#engine }
}

// const a = function() { /* operations with "this" */ }
// a.call(myObj)

// const b = (me) => { /* operations with "me" */ }
// b(myObj)