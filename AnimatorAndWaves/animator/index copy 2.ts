// @ts-nocheck

import { $1, $el, loadImage, floor, abs, sign, max, lerp, loop, sleep, clamp, random } from '../util.js'
import Vec2 from '../vec2.js'
import './jszip.js'

// const $ = Object.fromEntries($('[id]').map(x => [x.id.split('-').map((v, i) => i == 0 ? v : v[0].toUpperCase() + v.slice(1)).join(''), x]))

const sceneEl                   = $1('#scene')
const timelineEl                = $1('#timeline')
const timebarEl                 = $1('#timebar')
const timebarPointerEl          = $1('#timebar-pointer')
const framebarEl                = $1('#framebar')
const paramsEl                  = $1('#params')
const repeatModeButtonEl        = $1('#repeat-mode-button')
const playPauseButtonEl         = $1('#play-pause-button')
const stopButtonEl              = $1('#stop-button')
const animationDurationInputEl  = $1('#animation-duration-input')
const dragNDropOverlayEl        = $1('#drag-n-drop-overlay')
const positionXInputEl          = $1('.param-position > .param-input1')
const positionYInputEl          = $1('.param-position > .param-input2')
const rotationInputEl           = $1('.param-rotation > .param-input')
const zIndexInputEl             = $1('.param-z-index > .param-input')
const rotationCenterXInputEl    = $1('.param-rotation-center > .param-input1')
const rotationCenterYInputEl    = $1('.param-rotation-center > .param-input2')
const sizeInputXEl              = $1('.param-size > .param-input1')
const sizeInputYEl              = $1('.param-size > .param-input2')

let repeatMode = 'no-repeat'

repeatModeButtonEl.on('click', e => {
    if (repeatMode == 'no-repeat') repeatMode = 'loop'
    else if (repeatMode == 'loop') repeatMode = 'ping-pong'
    else if (repeatMode == 'ping-pong') repeatMode = 'no-repeat'
    repeatModeButtonEl.style.background = `center/100% 100% url(./${repeatMode}.svg)`
})
let playing = false
function setPlaying(v) {
    playing = v
    if (currentPos == 1) {
        currentPos = 0
        playbackPos = 0
        animStartPos = 0
    }
    if (playing)
        playPauseButtonEl.classList.add('pause')
    else {
        currentPos = animStartPos
        playbackPos = animStartPos
        setAnimationPosition(currentPos)
        playPauseButtonEl.classList.remove('pause')
    }
}
playPauseButtonEl.on('click', e => {
    setPlaying(!playing)
})
stopButtonEl.on('click', e => {
    playing = false
    playPauseButtonEl.classList.remove('pause')
    currentPos = 0
    playbackPos = 0
    animStartPos = 0
    setAnimationPosition(currentPos)
})

on('keydown', e => {
    if (e.repeat != 0) return
    if (e.code == 'Space') {
        setPlaying(!playing)
    }
    if (e.code == 'Delete') {
        // i
        // console.log(parts, frames)
    }
})

const framePointEls = new Map
const frames = new Map

on('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
        console.log('Saving...')
        saveAnimation()
    }
})
const imageTypeExts = {
    'image/gif': ['.gif'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    // 'image/tiff': ['.tif', '.tiff'],
    // 'image/vnd.wap.wbmp': ['.wbmp'],
    'image/x-icon': ['.ico'],
    // 'image/x-jng': ['.jng'],
    'image/x-ms-bmp': ['.bmp'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
}
async function saveAnimation() {
    const zip = new JSZip()
    const animation = {
        parts: [],
        loopMode: repeatMode,
        duration: animationDuration
    }
    const imgs = []
    for (const [k, v] of frames) {
        let i
        if (!imgs.includes(v.part.hash)) {
            i = imgs.length
            imgs.push(v.part.hash)
            const file = files.get(v.part.hash)
            const filename = i + (imageTypeExts[file.type][0] ?? '.wtf')
            zip.file(filename, file.buf)
        }
        else i = imgs.indexOf(v.part.hash)
        animation.parts.push([i, [...v.frames].map(x => [x[0], [x[1].pos.x, x[1].pos.y, x[1].rotation, x[1].rotationCenter.x, x[1].rotationCenter.y, x[1].size.x, x[1].size.y, x[1].z ]])])
    }
    zip.file('animation.json', JSON.stringify(animation))
    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'animation.zip'
    link.click()
}

async function loadAnimation(buf) {
    const zip = new JSZip()
    const data = await zip.loadAsync(buf)
    if (!('animation.json' in data.files)) return false
    for (const [k, f] of files) URL.revokeObjectURL(f.url)
    files.clear()
    let animation
    const idx2hash = new Map
    await Promise.all([...Object.keys(data.files)].map((k) => (async () => {
        const f = data.files[k]
        const ext = f.name.match(/\.[^\.]*$/)?.[0].toLowerCase()
        if (f.name == 'animation.json')
            animation = JSON.parse(await f.async('text'))
        else if (Object.values(imageTypeExts).flat().includes(ext)) {
            const buf = await f.async('arraybuffer')
            const type = Object.entries(imageTypeExts).find(x => x[1].includes(ext))[0]
            const blob = new Blob([buf], { type })
            const url = URL.createObjectURL(blob)
            const hash = await calculateChecksum(buf)
            const img = await loadImage(url)
            idx2hash.set(Number(f.name.replace(/\.[^\.]*$/, '')), hash)
            files.set(hash, { buf, url, type, img })
        }
    })()))

    repeatModeButtonEl.style.background = `center/100% 100% url(./${animation.loopMode}.svg)`
    repeatMode = animation.loopMode
    
    animationDurationInputEl.innerText = animation.duration.toFixed(1)
    animationDuration = animation.duration
    
    frames.clear()
    for (const [k, v] of framePointEls) v.remove()
    framePointEls.clear()
    for (const p of parts) p.el.remove()
    parts = []
    let counter = 0
    for (const part of animation.parts) {
        const fileHash = idx2hash.get(part[0])
        const file = files.get(fileHash)
        const i = counter++
        const _frames = new Map(part[1].map(x => [x[0], {
            pos: Vec2(x[1][0], x[1][1]),
            rotation: x[1][2],
            rotationCenter: Vec2(x[1][3], x[1][4]),
            size: Vec2(x[1][5], x[1][6]),
            z: x[1][7]
        }]))
        const _part = createPart(fileHash, _frames.values()[0])
        _part.frames = _frames
        frames.set(i, { frames: _frames, part: _part })
        parts.push(_part)
        // framePointEls

    }
    if (animation.parts.length > 0) {
        for (const [pos, p] of animation.parts[0][1]) {
            createFrameAt(pos, parts.map(p => p.frames.get(pos)))
        }
    }

    selectPart(null)
    setAnimationPosition(0)

    // Сначала добавить parts

}

function createFrameAt(pos, vals) {
    if (!framePointEls.has(pos)) {
        const frameEl = $el('div', { class: 'framebar-point' })
        frameEl.on('click', e => {
            setAnimationPosition(pos) // Исправить чтобы я мог repositionFrame()
        })
        frameEl.on('contextmenu', e => {
            e.preventDefault()
            const el = framePointEls.get(pos) // Исправить чтобы я мог repositionFrame()
            el.remove()
            framePointEls.delete(pos) // Исправить чтобы я мог repositionFrame()
            for (const [k, f] of frames) {
                f.frames.delete(pos) // Исправить чтобы я мог repositionFrame()
            }
            setAnimationPosition(currentAnimationPos)
        })
        frameEl.style.left = `${pos * 100}%`
        framebarEl.appendChild(frameEl)
        framePointEls.set(pos, frameEl)

    }
    for (const i in parts) {
        const p = parts[i]
        if (!frames.has(i)) {
            frames.set(i, {
                part: p,
                frames: p.frames
            })
        }
        const f = frames.get(i)
        // Задавать из соседних штучек
        // if (!f.frames.has(pos))
        f.frames.set(pos, {
            pos: vals[i].pos.copy(),
            rotation: vals[i].rotation,
            rotationCenter: vals[i].rotationCenter.copy(),
            size: vals[i].size.copy(),
            z: vals[i].z
        })
    }
}

on('dragover', e => {
    e.preventDefault()
    dragNDropOverlayEl.classList.remove('hidden')
})

on('dragleave', () => {
    dragNDropOverlayEl.classList.add('hidden')
})

async function calculateChecksum(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(x => x.toString(16).padStart(2, '0')).join('')
    return hashHex
}

const files = new Map()

on('drop', async e => {
    e.preventDefault()
    dragNDropOverlayEl.classList.add('hidden')
    const _files = e.dataTransfer.files
    await Promise.all([..._files].map(file => (async () => {
        const ext = file.name.match(/\.[^\.]*$/)?.[0].toLowerCase()
        if ((file.type in imageTypeExts) || Object.values(imageTypeExts).flat().includes(ext)) {
            const buf = await file.arrayBuffer()
            const hash = await calculateChecksum(buf)
            if (!files.has(hash)) {
                const blob = new Blob([buf], { type: file.type })
                const url = URL.createObjectURL(blob)
                files.set(hash, {buf, url, type: file.type, img: await loadImage(url)})
            }
            parts.push(createPart(hash))
            createAutoFrameAt(currentAnimationPos)
        }
        if (ext == '.zip') {
            // TODO: allow only single zip load
            await loadAnimation(await file.arrayBuffer())
        }
    })()))
})


let currentAnimationPos = 0
function createAutoFrameAt(pos) {
    if (!framePointEls.has(pos)) {
        const frameEl = $el('div', { class: 'framebar-point' })
        frameEl.on('click', e => {
            setAnimationPosition(pos) // Исправить чтобы я мог repositionFrame()
        })
        frameEl.on('contextmenu', e => {
            e.preventDefault()
            const el = framePointEls.get(pos) // Исправить чтобы я мог repositionFrame()
            el.remove()
            framePointEls.delete(pos) // Исправить чтобы я мог repositionFrame()
            for (const [k, f] of frames) {
                f.frames.delete(pos) // Исправить чтобы я мог repositionFrame()
            }
            setAnimationPosition(currentAnimationPos)
        })
        frameEl.style.left = `${pos * 100}%`
        framebarEl.appendChild(frameEl)
        framePointEls.set(pos, frameEl)

    }
    for (const i in parts) {
        const p = parts[i]
        if (!frames.has(i)) {
            frames.set(i, {
                part: p,
                frames: p.frames
            })
        }
        const f = frames.get(i)
        // Задавать из соседних штучек
        // if (!f.frames.has(pos))
        f.frames.set(pos, {
            pos: p.pos.copy(),
            rotation: p.rotation,
            rotationCenter: p.rotationCenter.copy(),
            size: p.size.copy(),
            z: p.z
        })
    }

    setAnimationPosition(pos)
}
function updateCurrentFrameValues() {
    const pos = currentAnimationPos
    createAutoFrameAt(pos)
    // for (const [l, v] of frames) {
    //     const f = v.frames.get(pos)
    //     if (f == null) continue
    //     f.pos.set(v.part.pos)
    //     f.rotationCenter.set(v.part.rotationCenter)
    //     f.size.set(v.part.size)
    //     f.rotation = v.rotation
    // }
}
framebarEl.on('click', e => {
    if (e.target != framebarEl) return
    const rect = framebarEl.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    createAutoFrameAt(pos)
    setAnimationPosition(pos)
})

let currentPos = 0
let playbackPos = 0
let animStartPos = 0

function setAnimationPosition(pos) {
    pos = clamp(pos, 0, 1)
    currentAnimationPos = pos
    timebarPointerEl.style.left = `${pos * 100}%`

    let lowt = -Infinity
    let hight = Infinity
    for (const [k, v] of framePointEls) {
        if (k <= pos && lowt < k) lowt = k
        if (k >= pos && hight > k) hight = k
    }
    if (hight == Infinity) hight = lowt
    if (lowt == -Infinity) lowt = hight
    const progress = lowt == hight ? 0 : (pos - lowt) / (hight - lowt)
    for (const p of parts) {
        const f1 = p.frames.get(lowt)
        const f2 = p.frames.get(hight)
        p.pos.x = lerp(progress, f1.pos.x, f2.pos.x)
        p.pos.y = lerp(progress, f1.pos.y, f2.pos.y)
        p.rotation = lerp(progress, f1.rotation, f2.rotation)
        p.rotationCenter.x = lerp(progress, f1.rotationCenter.x, f2.rotationCenter.x)
        p.rotationCenter.y = lerp(progress, f1.rotationCenter.y, f2.rotationCenter.y)
        p.size.x = lerp(progress, f1.size.x, f2.size.x)
        p.size.y = lerp(progress, f1.size.y, f2.size.y)
        p.z = lerp(progress, f1.z, f2.z)
        p.render()
        if (selectedPart == p) renderEl3()
    }
}

{
    function changePointerPos(e) {
        const rect = timebarEl.getBoundingClientRect()
        currentPos = (e.clientX - rect.left) / rect.width
        currentPos = clamp(currentPos, 0, 1)
        playbackPos = currentPos
        animStartPos = currentPos
        setAnimationPosition(currentPos)
    }
    let draggingPointer = false
    timebarEl.on('mousedown', e => {
        draggingPointer = true
        changePointerPos(e)
    })
    on('mouseup', e => {
        draggingPointer = false
    })
    on('mousemove', e => {
        if (!draggingPointer) return
        changePointerPos(e)
    })
}

let cursorAngle1 = null
let cursorAngle2 = null
let cursorAngleOld1 = null
let cursorAngleOld2 = null
let draggingOld = false
let movingRotationCenterOld = false
function setCursor(id, v) {
    if (id == 1)
        cursorAngle1 = v
    else if (id == 2)
        cursorAngle2 = v
}

loop(async () => {
    await sleep(1 / 60)
    
    if (cursorAngle2 == null) cursorAngleOld2 = null
    if (cursorAngle1 == null) cursorAngleOld1 = null
    if (dragging) {
        if (!draggingOld)
            document.body.style.cursor = 'move'
    }
    else if (movingRotationCenter) {
        if (!movingRotationCenterOld) {
            
            document.body.style.cursor = 'grabbing'
        document.body.classList.remove('no-hard-cursor')
        }
    }
    else if (cursorAngle2 != null) {
        let draw = false
        if (cursorAngleOld2 == null) {
            cursorAngleOld2 = cursorAngle2
            draw = true
        }
        if (!draw && abs(cursorAngleOld2 - cursorAngle2) > 5) {
            cursorAngleOld2 = cursorAngle2
            draw = true
        }
        if (draw) {
            document.body.style.cursor = `url("data:image/svg+xml,${
                encodeURIComponent(`<svg width="44" height="42" viewBox="0 0 44 42" xmlns="http://www.w3.org/2000/svg"><path transform="rotate(${floor(cursorAngle2 * 10) / 10} 21 21)" d="M35.5157 15.5109L34.5966 15.3156L34.9481 16.187L35.6711 17.9796C35.4789 18.0233 35.2406 18.0762 34.9613 18.1361C34.151 18.3099 32.9966 18.5417 31.6227 18.7736C28.8715 19.238 25.2549 19.7 21.7647 19.7C18.2753 19.7 14.7772 19.2382 12.1456 18.7743C10.8313 18.5425 9.73636 18.3109 8.97082 18.1374C8.71875 18.0802 8.50246 18.0294 8.3259 17.987L9.05193 16.187L9.43361 15.2408L8.45193 15.5189L1.8637 17.3856L1.08337 17.6067L1.63143 18.2045L6.33732 23.3379L7.02925 24.0927L7.19897 23.0829L7.58004 20.8155C7.76958 20.861 8.00697 20.9165 8.28752 20.9795C9.0738 21.1561 10.1997 21.3911 11.5621 21.6261C14.2845 22.0956 17.9618 22.5667 21.7647 22.5667C25.5669 22.5667 29.361 22.0957 32.1992 21.6266C33.6196 21.3919 34.8036 21.1571 35.6333 20.9807C35.9482 20.9138 36.2122 20.8553 36.4188 20.8084L36.801 23.0829L36.9805 24.1504L37.6769 23.3217L42.3828 17.7217L42.9186 17.084L42.1039 16.9109L35.5157 15.5109Z" fill="white" stroke="black"/></svg>`)
            }") 21 21, auto`
        document.body.classList.remove('no-hard-cursor')
        }
    } else if (cursorAngle1 != null) {
        let draw = false
        if (cursorAngleOld1 == null) {
            cursorAngleOld1 = cursorAngle1
            draw = true
        }
        if (!draw && abs(cursorAngleOld1 - cursorAngle1) > 5) {
            cursorAngleOld1 = cursorAngle1
            draw = true
        }
        if (draw) {
            document.body.style.cursor = `url("data:image/svg+xml,${
                encodeURIComponent(`<svg width="28" height="24" viewBox="-1 -1 27 23" xmlns="http://www.w3.org/2000/svg"><path transform="rotate(${floor(cursorAngle1 * 10) / 10} 13 11)" d="M20.3536 6.64645L20.2071 6.5H20H19H18.5V7V9.5H7.5V7V6.5H7H6H5.79289L5.64645 6.64645L1.64645 10.6464L1.29289 11L1.64645 11.3536L5.64645 15.3536L5.79289 15.5H6H7H7.5V15V12.5H18.5V15V15.5H19H20H20.2071L20.3536 15.3536L24.3536 11.3536L24.7071 11L24.3536 10.6464L20.3536 6.64645Z" fill="white" stroke="black"/></svg>`)
            }") 12 12, auto`
        document.body.classList.remove('no-hard-cursor')
        }
    } 
    else {
        document.body.classList.add('no-hard-cursor')
        document.body.style.cursor = 'auto'
    }
    draggingOld = dragging
    movingRotationCenterOld = movingRotationCenter
})

loop(async () => {
    await sleep(1 / 60)


    // document.body.style.cursor = `url("data:image/svg+xml,${
    //     encodeURIComponent(`<svg width="28" height="24" viewBox="-1 -1 27 23" xmlns="http://www.w3.org/2000/svg"><path transform="rotate(${performance.now() / 1000 * 360} 13 11)" d="M20.3536 6.64645L20.2071 6.5H20H19H18.5V7V9.5H7.5V7V6.5H7H6H5.79289L5.64645 6.64645L1.64645 10.6464L1.29289 11L1.64645 11.3536L5.64645 15.3536L5.79289 15.5H6H7H7.5V15V12.5H18.5V15V15.5H19H20H20.2071L20.3536 15.3536L24.3536 11.3536L24.7071 11L24.3536 10.6464L20.3536 6.64645Z" fill="white" stroke="black"/></svg>`)
    // }") 12 12, auto`
    // document.body.style.cursor = `url("data:image/svg+xml,${
    //     encodeURIComponent(`<svg width="44" height="42" viewBox="0 0 44 42" xmlns="http://www.w3.org/2000/svg"><path transform="rotate(${performance.now() / 1000 * 360} 21 21)" d="M35.5157 15.5109L34.5966 15.3156L34.9481 16.187L35.6711 17.9796C35.4789 18.0233 35.2406 18.0762 34.9613 18.1361C34.151 18.3099 32.9966 18.5417 31.6227 18.7736C28.8715 19.238 25.2549 19.7 21.7647 19.7C18.2753 19.7 14.7772 19.2382 12.1456 18.7743C10.8313 18.5425 9.73636 18.3109 8.97082 18.1374C8.71875 18.0802 8.50246 18.0294 8.3259 17.987L9.05193 16.187L9.43361 15.2408L8.45193 15.5189L1.8637 17.3856L1.08337 17.6067L1.63143 18.2045L6.33732 23.3379L7.02925 24.0927L7.19897 23.0829L7.58004 20.8155C7.76958 20.861 8.00697 20.9165 8.28752 20.9795C9.0738 21.1561 10.1997 21.3911 11.5621 21.6261C14.2845 22.0956 17.9618 22.5667 21.7647 22.5667C25.5669 22.5667 29.361 22.0957 32.1992 21.6266C33.6196 21.3919 34.8036 21.1571 35.6333 20.9807C35.9482 20.9138 36.2122 20.8553 36.4188 20.8084L36.801 23.0829L36.9805 24.1504L37.6769 23.3217L42.3828 17.7217L42.9186 17.084L42.1039 16.9109L35.5157 15.5109Z" fill="white" stroke="black"/></svg>`)
    // }") 21 21, auto`


    if (playing) {
        playbackPos += 1 / 60 / animationDuration
        if (repeatMode == 'no-repeat') {
            if (playbackPos > 1) {
                playbackPos = 1
                playing = false
                playPauseButtonEl.classList.remove('pause')
            }
            currentPos = playbackPos
        }
        else if (repeatMode == 'loop') {
            playbackPos = playbackPos % 1
            currentPos = playbackPos
        }
        else if (repeatMode == 'ping-pong') {
            playbackPos = playbackPos % 2
            if (playbackPos < 1) currentPos = playbackPos
            else currentPos = 1 - (playbackPos - 1)
        }
        setAnimationPosition(currentPos)
    }
})

let dragging = false
const
    dragStartPos = Vec2(0, 0),
    dragStartMousePos = Vec2(0, 0)

let resizing = false
const
        resizeStartSize = Vec2(0, 0),
        resizeStartPos = Vec2(0, 0),
        resizeStartMousePos = Vec2(0, 0),
        resizingDirection = Vec2(0, 0)

let rotating = false
const rotateStartCursorPos = Vec2(0, 0)
let rotateStartRotation = 0

let movingRotationCenter = false
const
    rotationCenterStartCursorPos = Vec2(0, 0),
    rotationCenterStartRotationCenter = Vec2(0, 0),
    rotationCenterStartPos = Vec2(0, 0)

function createPart(hash, cfg) {
    const file = files.get(hash)
    const img = file.img
    const me = {}
    cfg ??= {}
    cfg.pos ??= Vec2(0, 0)
    cfg.rotation ??= 0
    cfg.rotationCenter ??= Vec2(0, 0)
    cfg.z ??= 0 // Инкрементировать
    cfg.size ??= Vec2(img.width, img.height)
    const el = me.el = $el('div', {
        style: {
            background: `url(${file.url})`,
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
            width: img.width + 'px',
            height: img.height + 'px',
            // NIGGER
            // cursor: 'move'
        },
        class: 'part'
    })
    me.frames = new Map
    me.hash = hash
    me.img = img
    me.rotation = cfg.rotation
    me.rotationCenter = cfg.rotationCenter
    me.pos = cfg.pos
    me.z = cfg.z
    me.size = cfg.size

    el.on('mousedown', () => {
        selectPart(me)
    })

    el.on('mousedown', e => {
        if (selectedPart?.el != el) return
        dragging = true
        dragStartPos.set(me.pos)
        dragStartMousePos.set(e.clientX, e.clientY)
    })
    function mov_(e) {
        me.pos.set(
            dragStartPos.x + (e.clientX - dragStartMousePos.x),
            dragStartPos.y + (e.clientY - dragStartMousePos.y)
        )
        render()
        renderEl3()
    }
    on('mouseup', e => {
        if (selectedPart?.el != el) return
        if (!dragging) return
        mov_(e)
        dragging = false
    })
    on('mousemove', e => {
        if (selectedPart?.el != el) return
        if (!dragging) return
        mov_(e)
        updateCurrentFrameValues()
    })


    function render() {
        const { el, rotation, pos, size, rotationCenter, z } = me
        el.style['z-index'] = z + 1000000000
        el.style.width = `${abs(size.x)}px`
        el.style.height = `${abs(size.y)}px`
        // el.style.transform = `translate(${pos.x - size.x / 2}px, ${pos.y - size.y / 2}px) rotate(${rotation / Math.PI * 180}deg)`
        el.style.transform = `translate(${pos.x - abs(size.x) / 2}px, ${pos.y - abs(size.y) / 2}px) translate(${rotationCenter.x}px,${rotationCenter.y}px) rotate(${rotation / Math.PI * 180}deg) translate(${-rotationCenter.x}px,${-rotationCenter.y}px) scale(${sign(size.x)}, ${sign(size.y)})`
    }
    me.render = render

    render()
    sceneEl.append(el)

    return me
}

on('keydown', e => {
    if (e.code == 'KeyF') {
        console.log(frames)
    }
    if (e.code == 'KeyP') {
        console.log(parts)
    }
})

let parts = []

let el1, el2, el3 = $el('div', {
    style: {
        visibility: 'hidden',
        pointerEvents: 'none'
    },
    child: el2 = $el('div', {
        style: {
            background: '#0003',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            margin: '30px'
        },
        child: el1 = $el('div', {
            style: {}
        })
    })
})
let el4 = $el('div', {
    style: {
        background: '#0005',
        border: 'solid white 3px',
        borderRadius: '100%',
        width: '11px',
        height: '11px',
        // NIGGER
        // cursor: 'grab'
    },
    class: 'rotationCenter'
})



function renderEl3() {
    const { pos, size, rotation, rotationCenter, z } = selectedPart
    el1.style.width = `${abs(size.x)}px`
    el1.style.height = `${abs(size.y)}px`
    el1.style.transform = `scale(${sign(size.x)}, ${sign(size.y)})`
    el3.style.transform = `translate(${pos.x - abs(size.x) / 2 - 12 - 30}px, ${pos.y - abs(size.y) / 2 - 12 - 30}px) translate(${rotationCenter.x}px,${rotationCenter.y}px) rotate(${rotation / Math.PI * 180}deg) translate(${-rotationCenter.x}px,${-rotationCenter.y}px)`
    el4.style.transform = `translate(${pos.x + rotationCenter.x - 7}px, ${pos.y + rotationCenter.y - 7}px)`
    el4.style['z-index'] = z + 1000000000 + 1

    positionXInputEl.innerText = pos.x.toFixed(2)
    positionYInputEl.innerText = pos.y.toFixed(2)
    rotationInputEl.innerText = (rotation / Math.PI * 180).toFixed(2)
    rotationCenterXInputEl.innerText = rotationCenter.x.toFixed(2)
    rotationCenterYInputEl.innerText = rotationCenter.y.toFixed(2)
    sizeInputXEl.innerText = size.x.toFixed(2)
    sizeInputYEl.innerText = size.y.toFixed(2)
    zIndexInputEl.innerText = z.toFixed(2)
    zIndexInputEl.innerText = z.toFixed(2)
}


function lox(el, cb, getv) {
    const cb2 = () => {
        const a = Number(el.innerText)
        if (selectedPart != null) {
            if (isNaN(a)) {
                el.innerText = getv().toFixed(2)
            }
            else {
                cb(a)
                selectedPart.render()
                renderEl3()
            }
        }
        updateCurrentFrameValues()
    }
    el.on('blur', e => {
        cb2()
    })
    el.on('keydown', e => {
        if (e.code == 'Enter') {
            e.preventDefault()
            cb2()
        }
    })
}

let animationDuration = 1
const animationDurationChanged = () => {
    const a = Number(animationDurationInputEl.innerText)
    if (isNaN(a)) {
        animationDurationInputEl.innerText = animationDuration.toFixed(1)
    }
    else {
        animationDuration = a
    }
}
animationDurationInputEl.on('blur', e => {
    animationDurationChanged()
})
animationDurationInputEl.on('keydown', e => {
    if (e.code == 'Enter') {
        e.preventDefault()
        animationDurationChanged()
        animationDurationInputEl.blur()
    }
})



lox(positionXInputEl, v => selectedPart.pos.x = v, () => selectedPart.pos.x)
lox(positionYInputEl, v => selectedPart.pos.y = v, () => selectedPart.pos.y)
lox(rotationInputEl, v => selectedPart.rotation = (v / 180 * Math.PI), () => selectedPart.rotation / Math.PI * 180)
lox(rotationCenterXInputEl, v => selectedPart.rotationCenter.x = v, () => selectedPart.rotationCenter.x)
lox(rotationCenterYInputEl, v => selectedPart.rotationCenter.y = v, () => selectedPart.rotationCenter.y)
lox(sizeInputXEl, v => selectedPart.size.x = v, () => selectedPart.size.x)
lox(sizeInputYEl, v => selectedPart.size.y = v, () => selectedPart.size.y)
lox(zIndexInputEl, v => selectedPart.z = v, () => selectedPart.z)




let selectedPart
function selectPart(part) {
    selectedPart = part
    if (selectedPart == null) {
        paramsEl.style.visibility = 'hidden'
        el4.style.visibility = 'hidden'
        el3.style.visibility = 'hidden'
        el3.style['pointer-events'] = 'none'
        return
    }
    paramsEl.style.visibility = 'visible'
    el4.style.visibility = 'visible'
    el3.style.visibility = 'visible'
    el3.style['pointer-events'] = 'auto'
    sceneEl.append(part.el)
    sceneEl.insertBefore(el3, part.el)
    sceneEl.append(el4)

    renderEl3()
    
    


}
el2.on('mousedown', e => {
    if (e.target != el2) return
    if (selectedPart == null) return
    resizing = true
    const { pos, size, rotation, rotationCenter } = selectedPart
    const r1 = sceneEl.getBoundingClientRect()
    const r = {
        left:   pos.x - (abs(size.x) + 24) / 2,
        right:  pos.x + (abs(size.x) + 24) / 2,
        top:    pos.y - (abs(size.y) + 24) / 2,
        bottom: pos.y + (abs(size.y) + 24) / 2
    }
    const m = Vec2(e.clientX, e.clientY)
        .sub(r1.left, r1.top)
        .sub(pos).sub(rotationCenter)
        .rotate(rotation)
        .add(pos).add(rotationCenter)
    resizingDirection.x = (((r.right - m.x) <= 12) ? 1 : (((m.x - r.left) < 12) ? -1 : 0)) * sign(size.x)
    resizingDirection.y = (((r.bottom - m.y) <= 12) ? 1 : (((m.y - r.top) < 12) ? -1 : 0)) * sign(size.y)
    resizing = true
    resizeStartPos.set(pos)
    resizeStartSize.set(size)
    resizeStartMousePos.set(e.clientX - r1.left, e.clientY - r1.top)
})
function siz_(e) {
    const { pos, size, rotation } = selectedPart
    const r1 = sceneEl.getBoundingClientRect()
    const v = Vec2(
        ((e.clientX - r1.left) - resizeStartMousePos.x) / 2,
        ((e.clientY - r1.top) - resizeStartMousePos.y) / 2
    ).rotate(rotation).mul(
        abs(resizingDirection.x),
        abs(resizingDirection.y)
    ).rotate(-rotation)
    pos.set(
        resizeStartPos.x + v.x,
        resizeStartPos.y + v.y
    )
    const v3 = Vec2(
        ((e.clientX - r1.left) - resizeStartMousePos.x),
        ((e.clientY - r1.top) - resizeStartMousePos.y)
    ).rotate(rotation)
    size.set(
        (resizeStartSize.x + v3.x * resizingDirection.x),
        (resizeStartSize.y + v3.y * resizingDirection.y)
    )
    selectedPart.render()
    renderEl3()
}
on('mouseup', e => {
    if (selectedPart == null) return
    if (resizing) {
        resizing = false
        siz_(e)
    }
})
let prevResizeCursorVisible = false
on('mousemove', e => {
    if (selectedPart == null) return
    if (resizing) {
        siz_(e)
        updateCurrentFrameValues()
    }
    if (!rotating && (resizing || e.target == el2)) {
        const { pos, size, rotation, rotationCenter } = selectedPart
        const r1 = sceneEl.getBoundingClientRect()
        const r = {
            left:   pos.x - (abs(size.x) + 24) / 2,
            right:  pos.x + (abs(size.x) + 24) / 2,
            top:    pos.y - (abs(size.y) + 24) / 2,
            bottom: pos.y + (abs(size.y) + 24) / 2
        }

        const m = Vec2(e.clientX, e.clientY)
            .sub(r1.left, r1.top)
            .sub(pos).sub(rotationCenter)
            .rotate(rotation)
            .add(pos).add(rotationCenter)
        const v = Vec2(
            (((r.right - m.x) <= 12) ? 1 : (((m.x - r.left) < 12) ? -1 : 0)),
            (((r.bottom - m.y) <= 12) ? 1 : (((m.y - r.top) < 12) ? -1 : 0))
        )
        // NIGGER
        const angle = `${(-v.angle()+rotation)/Math.PI*180+90}`
        setCursor(1, angle)
    }
    else {
        setCursor(1, null)
    }
    
})

const el5 = $el('div', {
    style: {
        background: '#01010101',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%'
    }
})
sceneEl.prepend(el5)



el3.on('mousedown', e => {
    if (e.target != el3) return
    if (selectedPart == null) return
    const { pos, size, rotation } = selectedPart
    rotating = true
    const r = sceneEl.getBoundingClientRect()
    rotateStartCursorPos.set(e.clientX - r.left, e.clientY - r.top)
    rotateStartRotation = rotation
})
function rot_(e) {
    const { pos, size, rotationCenter } = selectedPart
    const r = sceneEl.getBoundingClientRect()
    const p = pos.added(rotationCenter)
    selectedPart.rotation = rotateStartRotation + p.angleTo(rotateStartCursorPos) - p.angleTo(Vec2(e.clientX - r.left, e.clientY - r.top))
    selectedPart.rotation = (selectedPart.rotation + Math.PI * 2) % (Math.PI * 2)
    if (selectedPart.rotation > Math.PI) selectedPart.rotation -= Math.PI * 2
    selectedPart.render()
    renderEl3()
}
on('mouseup', e => {
    if (selectedPart == null) return
    if (rotating) {
        rotating = false
        rot_(e)
    }
})
on('mousemove', e => {
    if (selectedPart == null) return
    if (rotating) {
        rot_(e)
        updateCurrentFrameValues()
    }
    if (!resizing && (rotating || e.target == el3)) {
        const { pos, size, rotation, rotationCenter } = selectedPart
        const r1 = sceneEl.getBoundingClientRect()
        
   
        // NIGGER
        const angle = `${-pos.added(rotationCenter).angleTo(Vec2(e.clientX - r1.left, e.clientY - r1.top))/Math.PI*180}`
        setCursor(2, angle)
    }
    else {
        setCursor(2, null)
    }
})




el4.on('mousedown', e => {
    if (e.target != el4) return
    if (selectedPart == null) return
    const { rotationCenter, pos } = selectedPart
    movingRotationCenter = true
    const r = sceneEl.getBoundingClientRect()
    rotationCenterStartCursorPos.set(e.clientX - r.left, e.clientY - r.top)
    rotationCenterStartRotationCenter.set(rotationCenter)
    rotationCenterStartPos.set(pos)
})
function rtc_(e) {
    const { rotation, pos } = selectedPart
    const r = sceneEl.getBoundingClientRect()
    const o = Vec2(
        ((e.clientX - r.left) - rotationCenterStartCursorPos.x),
        ((e.clientY - r.top) - rotationCenterStartCursorPos.y)
    )
    const t = o.rotated(rotation)
    selectedPart.rotationCenter.set(
        rotationCenterStartRotationCenter.added(t)
    )
    pos.set(rotationCenterStartPos.subbed(o.rotated(rotation)).added(o))
    selectedPart.render()
    renderEl3()
}
on('mouseup', e => {
    if (selectedPart == null) return
    if (movingRotationCenter) {
        movingRotationCenter = false
        rtc_(e)
    }
})
on('mousemove', e => {
    if (selectedPart == null) return
    if (movingRotationCenter) {
        rtc_(e)
        updateCurrentFrameValues()
    }
})

const centerCross1El = $el('div', { style: { height: '2.5px', transform: `translateX(-50%)`, background: '#00000045' } })
const centerCross2El = $el('div', { style: { width: '2.5px', transform: `translateY(-50%)`, background: '#00000045' } })
sceneEl.prepend(centerCross1El, centerCross2El)
new ResizeObserver(() => {
    const rect = sceneEl.getBoundingClientRect()
    centerCross1El.style.width = rect.width + 'px'
    centerCross2El.style.height = rect.height + 'px'
}).observe(sceneEl)

selectPart(null)
on('mousedown', e => {
    if (e.target == el5) selectPart(null)
})

createAutoFrameAt(0)


// createParser({ parts: arr(map(f64, { position: f64[2], rotation: f64, rotationCenter: f64[2], size: f64[2], zIndex: f64, imageIndex: i32 })) })

// parts: [
//  [
//   [<time>, [<positionX>, <positionY>, <rotation>, <rotationCenterX>, <rotationCenterY>, <sizeX>, <sizeY>, <zIndex>, <imgIdx>]],
//   [<time>, [<positionX>, <positionY>, <rotation>, <rotationCenterX>, <rotationCenterY>, <sizeX>, <sizeY>, <zIndex>, <imgIdx>]]
//  ],
//  [
//   [<time>, [<positionX>, <positionY>, <rotation>, <rotationCenterX>, <rotationCenterY>, <sizeX>, <sizeY>, <zIndex>, <imgIdx>]],
//   [<time>, [<positionX>, <positionY>, <rotation>, <rotationCenterX>, <rotationCenterY>, <sizeX>, <sizeY>, <zIndex>, <imgIdx>]]
//  ]
// ] 


// Сделать смену изображений и список изображений с заменой при dragndrop
// Кнопка Delete!!! для удаления картинок
// Масштабирование с Shift
// Ctrl + V изображения
// Ctrl + C, Ctrl + V part-ы
// SVGфицировать всё
// Повороты позволяют обходить лимиты
// Передвижение кадров

// Сделано: Курсоры адекватные (с помощью cursor: svg)
// Сделано: Z-Index
// Сделано: Скалинг позволяет делать -1
// Сделано: Красивый drag&drop
// Сделано: Сохранять loop-mode и duration