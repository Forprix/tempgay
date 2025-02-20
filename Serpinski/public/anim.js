import { parseCSSColor } from './css-color-parser.js'

function transitionMethod(value) {
    if (typeof value != 'string')
        return value
    return ({
        'linear' : t => t,
        'ease': t => (1 - Math.cos(t * Math.PI)) / 2,
        'ease-in': t => t * t,
        'ease-out': t => 1 - Math.pow(1 - t, 2),
        'ease-in-out': t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    })[value.toLowerCase()]
}

export class Circle {
    /**
     * @typedef {object} CircleConfig
     * @property {[number, number]} pos
     * @property {string?} color
     * @property {number?} alpha
     * @property {number?} size
     * @property {number?} zIndex
     */
    /**
     * @param {(CircleConfig|CircleConfig[])} [config]
    */
    constructor(config = {}) {
        this.type = 'circle'
        this.steps = config instanceof Array ? config : [config]
        if (this.steps.length == 0) this.steps.push({})
        this.steps[0].color ??= 'white'
        this.steps[0].alpha ??= 1
        this.steps[0].size ??= 8
        this.steps[0].zIndex ??= 0
        for (const step of this.steps) {
            if (step.color)
                step.rgba ??= parseCSSColor(step.color)
            step.transitionMethod ??= transitionMethod(step.transition ?? 'linear')
        }
        this.index = 0
        this.t = 0
        this.update(0)
    }
    update(dt) {
        this.t += dt
        let isEnd, o1
        while (true) {
            isEnd = this.index + 1 == this.steps.length
            o1 = this.steps[this.index]
            if (isEnd || (this.t <= o1.duration)) break
            this.t -= o1.duration
            ++this.index
        }
        if (isEnd && this.t > o1.duration) {
            this.dead = true
            return
        }

        let o2 = this.steps[this.index + (isEnd ? 0 : 1)]
        o2.pos ??= o1.pos
        o2.rgba ??= o1.rgba
        o2.alpha ??= o1.alpha
        o2.size ??= o1.size
        o2.zIndex ??= o1.zIndex

        const t_ = isEnd ? 0 : this.t / o1.duration
        const t = o1.transitionMethod(t_)

        try {
            this.pos = [
                o1.pos[0] + (o2.pos[0] - o1.pos[0]) * t,
                o1.pos[1] + (o2.pos[1] - o1.pos[1]) * t
            ]
        } catch {
            console.error({...pos})
        }
        this.color = 'rgba(' + [
            o1.rgba[0] + (o2.rgba[0] - o1.rgba[0]) * t,
            o1.rgba[1] + (o2.rgba[1] - o1.rgba[1]) * t,
            o1.rgba[2] + (o2.rgba[2] - o1.rgba[2]) * t,
            o1.rgba[3] + (o2.rgba[3] - o1.rgba[3]) * t
        ].join(',') + ')'
        this.alpha = o1.alpha + (o2.alpha - o1.alpha) * t
        this.size = o1.size + (o2.size - o1.size) * t
        this.zIndex = o1.zIndex + (o2.zIndex - o1.zIndex) * t
    }
}

export class Line {
    /**
     * @typedef {object} LineConfig
     * @property {[number, number]} pos1
     * @property {[number, number]} pos2
     * @property {string?} color
     * @property {number?} alpha
     * @property {number?} width
     * @property {number?} zIndex
    */
    /**
     * @param {(LineConfig|LineConfig[])} [config]
    */
    constructor(config = {}) {
        this.type = 'line'
        this.steps = config instanceof Array ? config : [config]
        if (this.steps.length == 0) this.steps.push({})
        this.steps[0].color ??= 'white'
        this.steps[0].alpha ??= 1
        this.steps[0].width ??= 1
        this.steps[0].zIndex ??= 0
        for (const step of this.steps) {
            if (step.color)
                step.rgba ??= parseCSSColor(step.color)
            step.transitionMethod ??= transitionMethod(step.transition ?? 'linear')
        }
        this.index = 0
        this.t = 0
        this.update(0)
    }
    update(dt) {
        this.t += dt
        let isEnd, o1
        while (true) {
            isEnd = this.index + 1 == this.steps.length
            o1 = this.steps[this.index]
            if (isEnd || (this.t <= o1.duration)) break
            this.t -= o1.duration
            ++this.index
        }
        if (isEnd && this.t > o1.duration) {
            this.dead = true
            return
        }

        let o2 = this.steps[this.index + (isEnd ? 0 : 1)]
        o2.pos1 ??= o1.pos1
        o2.pos2 ??= o1.pos2
        o2.rgba ??= o1.rgba
        o2.alpha ??= o1.alpha
        o2.width ??= o1.width
        o2.zIndex ??= o1.zIndex

        const t_ = isEnd ? 0 : this.t / o1.duration
        const t = o1.transitionMethod(t_)

        this.pos1 = [
            o1.pos1[0] + (o2.pos1[0] - o1.pos1[0]) * t,
            o1.pos1[1] + (o2.pos1[1] - o1.pos1[1]) * t
        ]
        this.pos2 = [
            o1.pos2[0] + (o2.pos2[0] - o1.pos2[0]) * t,
            o1.pos2[1] + (o2.pos2[1] - o1.pos2[1]) * t
        ]
        this.color = 'rgba(' + [
            o1.rgba[0] + (o2.rgba[0] - o1.rgba[0]) * t,
            o1.rgba[1] + (o2.rgba[1] - o1.rgba[1]) * t,
            o1.rgba[2] + (o2.rgba[2] - o1.rgba[2]) * t,
            o1.rgba[3] + (o2.rgba[3] - o1.rgba[3]) * t
        ].join(',') + ')'
        this.alpha = o1.alpha + (o2.alpha - o1.alpha) * t
        this.width = o1.width + (o2.width - o1.width) * t
        this.zIndex = o1.zIndex + (o2.zIndex - o1.zIndex) * t
    }
}

export class Polygon {
    /**
     * @typedef {object} PolygonConfig
     * @property {[number, number][]} vertices
     * @property {string?} color
     * @property {number?} alpha
     * @property {number?} width
     * @property {number?} zIndex
    */
    /**
     * @param {(PolygonConfig|PolygonConfig[])} [config]
    */
    constructor(config = {}) {
        this.type = 'polygon'
        this.steps = config instanceof Array ? config : [config]
        if (this.steps.length == 0) this.steps.push({})
        this.steps[0].color ??= 'white'
        this.steps[0].alpha ??= 1
        this.steps[0].width ??= 1
        this.steps[0].zIndex ??= 0
        for (const step of this.steps) {
            if (step.color)
                step.rgba ??= parseCSSColor(step.color)
            step.transitionMethod ??= transitionMethod(step.transition ?? 'linear')
        }
        this.index = 0
        this.t = 0
        this.update(0)
    }
    update(dt) {
        this.t += dt
        let isEnd, o1
        while (true) {
            isEnd = this.index + 1 == this.steps.length
            o1 = this.steps[this.index]
            if (isEnd || (this.t <= o1.duration)) break
            this.t -= o1.duration
            ++this.index
        }
        if (isEnd && this.t > o1.duration) {
            this.dead = true
            return
        }

        let o2 = this.steps[this.index + (isEnd ? 0 : 1)]
        o2.vertices ??= o1.vertices
        o2.rgba ??= o1.rgba
        o2.alpha ??= o1.alpha
        o2.width ??= o1.width
        o2.zIndex ??= o1.zIndex

        const t_ = isEnd ? 0 : this.t / o1.duration
        const t = o1.transitionMethod(t_)

        this.vertices = o2.vertices
        this.color = 'rgba(' + [
            o1.rgba[0] + (o2.rgba[0] - o1.rgba[0]) * t,
            o1.rgba[1] + (o2.rgba[1] - o1.rgba[1]) * t,
            o1.rgba[2] + (o2.rgba[2] - o1.rgba[2]) * t,
            o1.rgba[3] + (o2.rgba[3] - o1.rgba[3]) * t
        ].join(',') + ')'
        this.alpha = o1.alpha + (o2.alpha - o1.alpha) * t
        this.width = o1.width + (o2.width - o1.width) * t
        this.zIndex = o1.zIndex + (o2.zIndex - o1.zIndex) * t
    }
}

export default {
    Circle,
    Line,
    Polygon
}