// @ts-nocheck

import { floor, abs, atan2, hypot, sin, cos } from './shared-util.js'


class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
    copy() {
        return new Vec2(this.x, this.y)
    }
    set(a, b) {
        if (a instanceof Vec2) {
            this.x = a.x
            this.y = a.y
        }
        else {
            this.x = a
            this.y = b
        }
        return this
    }
    setFromAngle(angle) {
        this.x = sin(angle)
        this.y = cos(angle)
        return this
    }

    angle() {
        return atan2(this.x, this.y)
    }
    angleTo(to) {
        return atan2(to.x - this.x, to.y - this.y)
    }
    distance(to) {
        return hypot(to.x - this.x, to.y - this.y)
    }
    size() {
        return hypot(this.x, this.y)
    }
    toString() {
        return `vec2(${this.x}, ${this.y})`
    }
    *[Symbol.iterator]() {
        yield this.x
        yield this.y
    }
    normalize() {
        const s = this.size()
        this.x /= s
        this.y /= s
        return this
    }
    normalized() {
        return this.copy().normalize()
    }
    
    add(a, b) {
        if (a instanceof Vec2) {
            this.x += a.x
            this.y += a.y
        }
        else {
            this.x += a
            this.y += b
        }
        return this
    }
    added(...args) {
        return this.copy().add(...args)
    }

    sub(a, b) {
        if (a instanceof Vec2) {
            this.x -= a.x
            this.y -= a.y
        }
        else {
            this.x -= a
            this.y -= b
        }
        return this
    }
    subbed(...args) {
        return this.copy().sub(...args)
    }

    mul(a, b) {
        if (a instanceof Vec2) {
            this.x *= a.x
            this.y *= a.y
        }
        else {
            this.x *= a
            this.y *= b
        }
        return this
    }
    mulled(...args) {
        return this.copy().mul(...args)
    }

    div(a, b) {
        if (a instanceof Vec2) {
            this.x /= a.x
            this.y /= a.y
        }
        else {
            this.x /= a
            this.y /= b
        }
        return this
    }
    divved(...args) {
        return this.copy().div(...args)
    }

    rotate(angle) {
        const s = this.size()
        const a = this.angle() + angle
        this.x = sin(a) * s
        this.y = cos(a) * s
        return this
    }
    rotated(...args) {
        return this.copy().rotate(...args)
    }
    
    floor() {
        this.x = floor(this.x)
        this.y = floor(this.y)
        return this
    }
    floored() {
        return this.copy().floor()
    }

    abs() {
        this.x = abs(this.x)
        this.y = abs(this.y)
        return this
    }
    absed() {
        return this.copy().abs()
    }
}

Vec2.fromAngle = angle => Vec2(sin(angle), cos(angle))

export default function(...args) { return new Vec2(...args) }