// @ts-nocheck

export * from './shared-util.js'

const _once : typeof EventTarget.prototype.addEventListener = function(type, listener, ...rest) {
    const handler = function (event) {
        listener.call(this, event)
        this.removeEventListener(type, handler, ...rest)
    }
    this.addEventListener(type, handler, ...rest)
    return this
}
const _xonce : typeof EventTarget.prototype.addEventListener = function(types, listener, ...rest) {
    const handler = function (event) {
        listener.call(this, event)
        for (const type of types)
            this.removeEventListener(type, handler, ...rest)
    }
    for (const type of types)
        this.addEventListener(type, handler, ...rest)
    return this
}

export function $(selector: string): Element[] & {
    on: typeof EventTarget.prototype.addEventListener,
    off: typeof EventTarget.prototype.removeEventListener,
    onсe: typeof _once,
    xonce: typeof _xonce,
    addEventListener: typeof EventTarget.prototype.addEventListener,
    removeEventListener: typeof EventTarget.prototype.removeEventListener,
    el?: Element,
} {
    const arr = [...document.querySelectorAll(selector)]
    arr.el = arr[0]
    arr.on = arr.addEventListener = function(...args) {
        for (const el of this)
            el.addEventListener(...args)
    }
    arr.off = arr.removeEventListener = function(...args) {
        for (const el of this)
            el.removeEventListener(...args)
    }
    arr.once = _once
    arr.xonce = _xonce
    return arr
}

// Same as document.querySelector
export function $1(selector: string): Element {
    return document.querySelector(selector)
}

const camel2dash = s => s.replace(/[A-Z]/g, x => '-' + x.toLowerCase())

// Creates Element
export function $el(tag, options) {
    options ??= {}
    
    const el = options.svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag)
    if (options.content)
        el.innerText = options.content
    if (options.attrs)
        for (const [key, val] of Object.entries(options.attrs))
            el.setAttribute(camel2dash(key), val)
    if (options.data)
        for (const [key, val] of Object.entries(options.data))
            el.setAttribute(`data-${key}`, val)
    if (options.class)
        el.classList.add(options.class)
    if (options.classes)
        for (const class_ of options.classes)
            el.classList.add(class_)
    if (options.id)
        el.id = options.id
    if (options.style) {
        el.style = ''
        for (const [key, val] of Object.entries(options.style))
            el.style[key] = val
    }
    if (options.child)
        el.appendChild(options.child)
    if (options.children)
        el.append(...options.children)
    return el
}

let urlResolver
export function normalizeUrl(url) {
    if (!urlResolver) urlResolver = document.createElement('a')
    urlResolver.href = url
    return urlResolver.href
}


EventTarget.prototype.on = function(...args) {
    EventTarget.prototype.addEventListener.call(this, ...args)
    return this
}
EventTarget.prototype.off = function(...args) {
    EventTarget.prototype.removeEventListener.call(this, ...args)
    return this
}
EventTarget.prototype.once = _once
EventTarget.prototype.xonce = _xonce

export const loadImage = (path : string) : Promise<HTMLImageElement> => new Promise(res => {
    const img = new Image()
    img.onload = () => res(img)
    img.src = path
})