import {$1, $fmod, $hsv2rgb, $time} from '/util.mjs'

const audios1 = Array(12).fill().map((_, i) => new Audio(`./sounds/down${i + 1}.mp3`))
const audios2 = Array(11).fill().map((_, i) => new Audio(`./sounds/up${i + 1}.mp3`))

onload = () => {


// const textEl = document.querySelector('.text-area')
const keyboardEl = document.querySelector('.keyboard')
window.keyboardEl = keyboardEl
for (const el1 of keyboardEl.children)
    for (const el2 of el1.children)
        el2.innerText = ''

const keys = [
    ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'PrintScreen', 'ScrollLock', 'Pause'],
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace', 'Insert', 'Home', 'PageUp'],
    ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'Delete', 'End', 'PageDown'],
    ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
    ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight', 'ArrowUp'],
    ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'Fn', 'ContextMenu', 'ControlRight', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
]
const keyData = []
{
    for (let y = 0; y < keys.length; ++y) {
        keyData.push([])
        for (let x = 0; x < keys[y].length; ++x)
            keyData[y].push({
                value: 0,
                pressed: false
            })
    }
}

function findKeyPos(code) {
    for (let y = 0; y < keys.length; ++y)
        for (let x = 0; x < keys[y].length; ++x)
            if (keys[y][x] == code)
                return [x, y]
}
function getKeyEl(pos) {
    return keyboardEl.children[pos[1]].children[pos[0]]
}

console.log(keyData) 
// 65 - 90

// let content = ''
addEventListener('keydown', e => {
    // switch (e.key) {
    //     case 'Backspace': content = content.slice(0, content.length - 1); break
    //     case 'Tab': case 'CapsLock': case 'Shift': case 'Control': case 'Alt': case 'Meta': break
    //     case 'Enter': content += '\n'; break
    //     default: content += e.key
    // }
    // textEl.innerText = content
    if (e.repeat) return
    const pos = findKeyPos(e.code)
    if (!pos) return
    // const el = getKeyEl(pos)
    new Audio(`./sounds/down${~~(Math.random() * 12 + 1)}.mp3`).play()
    keyData[pos[1]][pos[0]].pressed = true
    e.preventDefault()
})
addEventListener('keyup', e => {
    const pos = findKeyPos(e.code)
    if (!pos) return
    // const el = getKeyEl(pos)
    new Audio(`./sounds/up${~~(Math.random() * 11 + 1)}.mp3`).play()
    keyData[pos[1]][pos[0]].pressed = false
    e.preventDefault()
})
addEventListener('blur', () => keyboardEl.classList.add('blurred'))
addEventListener('focus', () => keyboardEl.classList.remove('blurred'))


let prevTime = performance.now()
const frame = () => {
    const newTime = performance.now()
    const dt = newTime - prevTime
    const rect_ = keyboardEl.getBoundingClientRect()
    let y = 0
    for (const el1 of keyboardEl.children) {
        let x = 0
        for (const el2 of el1.children) {
            const d = keyData[y][x]
            if (d.pressed)
                d.value = 1
            else
                d.value = Math.max(d.value - dt / 200, 0)
            const rect = el2.getBoundingClientRect()
            el2.style['background'] = $hsv2rgb([0, 0, d.value * 80 + 20]).toString()
            const color = $hsv2rgb([(((rect.left - rect_.left + (rect.width / 2)) / (rect_.width) - performance.now() / 1000 / 2) % 1) * 360, (1 - d.value) * 60, 100]).toString()
            el2.style['box-shadow'] = `0 0 6px ${color}`
            el2.style['border-color'] = color
            ++x
        }
        ++y
    }
    
    prevTime = newTime
    setTimeout(frame, 20)
}
frame()

}