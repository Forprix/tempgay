// @ts-nocheck

/** @typedef {{a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean, g: boolean, h: boolean, i: boolean, j: boolean, k: boolean, l: boolean, m: boolean, n: boolean, o: boolean, p: boolean, q: boolean, r: boolean, s: boolean, t: boolean, u: boolean, v: boolean, w: boolean, x: boolean, y: boolean, z: boolean, '1': boolean, '2': boolean, '3': boolean, '4': boolean, '5': boolean, '6': boolean, '7': boolean, '8': boolean, '9': boolean, '0': boolean, space: boolean, tab: boolean, caps: boolean, lshift: boolean, lctrl: boolean, lalt: boolean, lmeta: boolean, comma: boolean, period: boolean, slash: boolean, backslash: boolean, semicolon: boolean, quote: boolean, lbracket: boolean, rbracket: boolean, minus: boolean, equal: boolean, backspace: boolean, enter: boolean, rshift: boolean, rctrl: boolean, ralt: boolean, menu: boolean, esc: boolean, f1: boolean, f2: boolean, f3: boolean, f4: boolean, f5: boolean, f6: boolean, f7: boolean, f8: boolean, f9: boolean, f10: boolean, f11: boolean, f12: boolean, del: boolean, end: boolean, pgdn: boolean, ins: boolean, home: boolean, pgup: boolean, prtsc: boolean, scrlk: boolean, left: boolean, right: boolean, up: boolean, down: boolean, num0: boolean, num1: boolean, num2: boolean, num3: boolean, num4: boolean, num5: boolean, num6: boolean, num7: boolean, num8: boolean, num9: boolean, numenter: boolean, numplus: boolean, numminus: boolean, nummult: boolean, numdiv: boolean, numlock: boolean, numdel: boolean, pause: boolean, tilde: boolean, lmb: boolean, mmb: boolean, rmb: boolean, mb3: boolean, mb4: boolean}} GameKeys */
/** @typedef {'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'|'l'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'0'|'space'|'tab'|'caps'|'lshift'|'lctrl'|'lalt'|'lmeta'|'comma'|'period'|'slash'|'backslash'|'semicolon'|'quote'|'lbracket'|'rbracket'|'minus'|'equal'|'backspace'|'enter'|'rshift'|'rctrl'|'ralt'|'menu'|'esc'|'f1'|'f2'|'f3'|'f4'|'f5'|'f6'|'f7'|'f8'|'f9'|'f10'|'f11'|'f12'|'del'|'end'|'pgdn'|'ins'|'home'|'pgup'|'prtsc'|'scrlk'|'left'|'right'|'up'|'down'|'num0'|'num1'|'num2'|'num3'|'num4'|'num5'|'num6'|'num7'|'num8'|'num9'|'numenter'|'numplus'|'numminus'|'nummult'|'numdiv'|'numlock'|'numdel'|'pause'|'tilde'|'lmb'|'mmb'|'rmb'|'mb3'|'mb4'} GameKey */

import Vec2 from '../vec2.js'
import { eventify } from '../util.js'

const keyCodeMap = {
    'KeyA': 'a', 'KeyB': 'b', 'KeyC': 'c', 'KeyD': 'd', 'KeyE': 'e', 'KeyF': 'f', 'KeyG': 'g',
    'KeyH': 'h', 'KeyI': 'i', 'KeyJ': 'j', 'KeyK': 'k', 'KeyL': 'l', 'KeyM': 'm', 'KeyN': 'n',
    'KeyO': 'o', 'KeyP': 'p', 'KeyQ': 'q', 'KeyR': 'r', 'KeyS': 's', 'KeyT': 't', 'KeyU': 'u',
    'KeyV': 'v', 'KeyW': 'w', 'KeyX': 'x', 'KeyY': 'y', 'KeyZ': 'z',
    'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
    'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8',
    'Digit9': '9', 'Digit0': '0',
    'Space': 'space',
    'Tab': 'tab',
    'CapsLock': 'caps',
    'ShiftLeft': 'lshift',
    'ControlLeft': 'lctrl',
    'AltLeft': 'lalt',
    'MetaLeft': 'lmeta',
    'Comma': 'comma',
    'Period': 'period',
    'Slash': 'slash',
    'Backslash': 'backslash',
    'Semicolon': 'semicolon',
    'Quote': 'quote',
    'BracketLeft': 'lbracket',
    'BracketRight': 'rbracket',
    'Minus': 'minus',
    'Equal': 'equal',
    'Backspace': 'backspace',
    'Enter': 'enter',
    'ShiftRight': 'rshift',
    'ControlRight': 'rctrl',
    'AltRight': 'ralt',
    'ContextMenu': 'menu',
    'Escape': 'esc',
    'F1': 'f1', 'F2': 'f2', 'F3': 'f3',
    'F4': 'f4', 'F5': 'f5', 'F6': 'f6',
    'F7': 'f7', 'F8': 'f8', 'F9': 'f9',
    'F10': 'f10', 'F11': 'f11', 'F12': 'f12',
    'Delete': 'del',
    'End': 'end',
    'PageDown': 'pgdn',
    'Insert': 'ins',
    'Home': 'home',
    'PageUp': 'pgup',
    'PrintScreen': 'prtsc',
    'ScrollLock': 'scrlk',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'Numpad0': 'num0', 'Numpad1': 'num1', 'Numpad2': 'num2',
    'Numpad3': 'num3', 'Numpad4': 'num4', 'Numpad5': 'num5',
    'Numpad6': 'num6', 'Numpad7': 'num7', 'Numpad8': 'num8',
    'Numpad9': 'num9',
    'NumpadEnter': 'numenter',
    'NumpadAdd': 'numplus',
    'NumpadSubtract': 'numminus',
    'NumpadMultiply': 'nummult',
    'NumpadDivide': 'numdiv',
    'NumLock': 'numlock',
    'NumpadDecimal': 'numdel',
    'Pause': 'pause',
    'Backquote': 'tilde'
}
const mouseButtonMap = ['lmb', 'mmb', 'rmb', 'mb3', 'mb4']

export default function(wrapper, contextTypes, options) {
    const me = {
        hide() {
            this.el.style.visibility = 'hidden'
        },
        show() {
            this.el.style.visibility = 'visible'
        },
        /**
         * @param {{zoom?: boolean, wheel?: boolean, tab?: boolean, lalt?: boolean, ralt?: boolean, mb3?: boolean, mb4?: boolean, rmb?: boolean, f1?: boolean, f2?: boolean, f3?: boolean, f4?: boolean, f5?: boolean, f6?: boolean, f7?: boolean, f8?: boolean, f9?: boolean, f10?: boolean, f11?: boolean, f12?: boolean, all?: boolean}} settings 
         * @returns {GameEngine}
        */
        preventDefault(settings) {
            const map = ['tab', 'lalt', 'ralt', 'mb3', 'mb4', 'rmb', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'wheel', 'zoom']
            const all = settings.all
            for (let i = 0; i < map.length; ++i) {
                const val = settings[map[i]] ?? all
                if (val != null) this.prevents[i] = val
            }
            return this
        },
        /**
         * @param {(cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void} work
         * @returns {GameEngine}
        */
        canvasWork(work) {
            /** @private */
            this.localCanvas ??= document.createElement('canvas')
            const localCanvas = this.localCanvas
            /** @private */
            this.localCanvasCtx ??= localCanvas.getContext('2d')
            work(localCanvas, this.localCanvasCtx)
            return this
        },
        /**
         * @param {string} url 
         * @param {'buffer'|'string'|'wasm'|'json'|'image'} format
         * @returns {string|ArrayBuffer|WebAssembly.Exports|any|ImageBitmap}
        */
        async asset(url, format) {
            const fmt = format ?? ({
                'txt': 'string',
                'bin': 'buffer',
                'wasm': 'wasm',
                'json': 'json',
                'png': 'image',
                'jpg': 'image',
                'jpeg': 'image',
                'bmp': 'image'
            })[url.match(/(?<=\.)[a-zA-Z0-9_\-]+$/)?.[0]?.toLowerCase?.()] ?? 'buffer'
            switch (fmt) {
                case 'string':
                    return await (await fetch(url)).text()
                case 'wasm':
                    return (await WebAssembly.instantiate(await (await fetch(url)).arrayBuffer(), {})).instance.exports
                case 'json':
                    return await (await fetch(url)).json()
                case 'image':
                    // CAN FLIP Y in createImageBitmap!
                    return await new Promise(res => {
                        const image = new Image()
                        image.onload = () => res(image)
                        image.src = url
                    }) 
                case 'buffer':
                default:
                    return await (await fetch(url)).arrayBuffer()
            }
        },
        /** @returns {number} */
        get time() {
            return performance.now() / 1000
        },
        setUpdateRate(rate) {
            fdt = rate
        },
        getUpdateRate() {
            return fdt
        }
    }

    const el = document.createElement('div')
    el.style = 'position: relative; width: 100%; height: 100%'
    if (options?.hidden)
        el.style.visibility = 'hidden'
    me.el = el

    me.canvases = []
    me.ctxes = []

    for (const [contextType, visibility, options] of contextTypes) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext(contextType, options)
        me.canvases.push(canvas)
        me.ctxes.push(ctx)
        if (visibility == 'visible') {
            canvas.style = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;'
            el.append(canvas)
        }
    }

    if (typeof wrapper == 'string') wrapper = document.querySelector(wrapper)
    wrapper.append(el)



    me.eventListeners = {}


    const emit = eventify(me, ['update', 'frame', 'resize',   'keydown', 'keyup', 'wheel',   'hidden', 'shown'])
    /** @private */
    me.emit = emit

    /** @type {((eventType: 'update', listener: (fdt: number) => void) => void) & ((eventType: 'frame', listener: (dt: number) => void) => void) & ((eventType: 'keydown', listener: (key: GameKey, char: string | null) => void) => void) & ((eventType: 'keyup', listener: (key: GameKey, char: string | null) => void) => void) & ((eventType: 'wheel', listener: (direction: number) => void) => GameEngine) & ((eventType: 'resize', listener: (size: [number, number]) => void) => GameEngine) & ((eventType: 'hidden', listener: () => void) => GameEngine) & ((eventType: 'shown', listener: () => void) => GameEngine)} */
    /** @type {((eventType: 'update', listener: (fdt: number) => void) => void) & ((eventType: 'frame', listener: (dt: number) => void) => void) & ((eventType: 'keydown', listener: (key: GameKey, char: string | null) => void) => void) & ((eventType: 'keyup', listener: (key: GameKey, char: string | null) => void) => void) & ((eventType: 'wheel', listener: (direction: number) => void) => GameEngine) & ((eventType: 'resize', listener: (size: [number, number]) => void) => GameEngine) & ((eventType: 'hidden', listener: () => void) => GameEngine) & ((eventType: 'shown', listener: () => void) => GameEngine)} */


    const mouse = {
        get x() { return this.pos[0] },
        get y() { return this.pos[1] },
        /** @type {[number, number]} */
        pos: [0, 0]
    }
    me.mouse = mouse
    me.interacted = false

    const keys = {}
    for (const k of Object.values(keyCodeMap))
        keys[k] = false
    /** @type {GameKeys} */
    me.keys = keys



    let fdt = 1 / 60
    let t = performance.now() / 1000
    let t2 = 0
    const frame = () => {
        const n = performance.now() / 1000
        const dt = n - t
        if (dt != 0) {
            t2 += dt
            while (t2 >= fdt) {
                t2 -= fdt
                emit('update', fdt)
            }
            emit('frame', dt)
            t = n
        }
        requestAnimationFrame(frame)
    }
    let animationStarted = false


    const prevents = Array(19).fill(false)
    /** @private */ me.prevents = prevents

    

    const getCharFromKeyEvent = (e) => {
        return e.key.length == 1 ? e.key : null
    }

    const keyPressed = (key, char) => {
        keys[key] = true
        emit('keydown', key, char)
    }
    const keyReleased = (key, char) => {
        keys[key] = false
        emit('keyup', key, char)
    }

    window.addEventListener('wheel', e => {
        if (prevents[18]) e.preventDefault()
        if (prevents[19] && e.ctrlKey) e.preventDefault()
    }, {passive: false})

    window.addEventListener('keydown', e => {
        me.interacted = true
        if (!e.repeat) {
            const k = keyCodeMap[e.code]
            if (!k) return
            keyPressed(k, getCharFromKeyEvent(e))
        }
        switch (e.code) {
            case 'Tab': if (prevents[0])  e.preventDefault(); break
            case 'F1':  if (prevents[6])  e.preventDefault(); break
            case 'F2':  if (prevents[7])  e.preventDefault(); break
            case 'F3':  if (prevents[8])  e.preventDefault(); break
            case 'F4':  if (prevents[9])  e.preventDefault(); break
            case 'F5':  if (prevents[10]) e.preventDefault(); break
            case 'F6':  if (prevents[11]) e.preventDefault(); break
            case 'F7':  if (prevents[12]) e.preventDefault(); break
            case 'F8':  if (prevents[13]) e.preventDefault(); break
            case 'F9':  if (prevents[14]) e.preventDefault(); break
            case 'F10': if (prevents[15]) e.preventDefault(); break
            case 'F11': if (prevents[16]) e.preventDefault(); break
            case 'F12': if (prevents[17]) e.preventDefault(); break
        }
    })
    window.addEventListener('keyup', e => {
        const k = keyCodeMap[e.code]
        if (!k) return
        keyReleased(k, getCharFromKeyEvent(e))
        switch (e.code) {
            case 'AltLeft':  if (prevents[1]) e.preventDefault(); break
            case 'AltRight': if (prevents[2]) e.preventDefault(); break
        }
    })
    window.addEventListener('blur', () => {
        emit('hidden')
        for (const key of Object.values(keyCodeMap)) keys[key] = false
    })
    window.addEventListener('focus', () => {
        emit('shown')
    })

    el.addEventListener('mousedown', e => {
        me.interacted = true
        const k = mouseButtonMap[e.button]
        if (!k) return
        keyPressed(k, null)
    })
    window.addEventListener('mouseup', e => {
        const k = mouseButtonMap[e.button]
        if (!k) return
        keyReleased(k, null)
        switch (e.button) {
            case 3: if (prevents[3]) e.preventDefault(); break
            case 4: if (prevents[4]) e.preventDefault(); break
        }
    })
    window.addEventListener('mouseleave', e => {
        for (const k of mouseButtonMap)
            keys[k] = false
    })
    window.addEventListener('mousemove', e => {
        // TODO: fix this until too late
        const rect = el.getBoundingClientRect()
        me.mouse.pos = [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]
    })
    el.addEventListener('contextmenu', e => {
        if (me.prevents[5]) e.preventDefault()
    })

    el.addEventListener('wheel', e => {
        if (e.deltaY != 0) emit('wheel', Math.sign(e.deltaY))
    })

    /** @private {boolean} */
    new ResizeObserver(() => {
        const rect = el.getBoundingClientRect()
        if (rect.width == 0 || rect.height == 0) return
        emit('resize', Vec2(rect.width, rect.height))
        if (!animationStarted) {
            animationStarted = true
            requestAnimationFrame(frame)
        }
    }).observe(el)

    return me
}
