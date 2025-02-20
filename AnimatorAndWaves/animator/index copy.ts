// @ts-nocheck

import { $1, $el, loadImage, floor, abs, max, lerp, loop, sleep, clamp } from '../util.js'
import Vec2 from '../vec2.js'
import './jszip.js'


const sceneEl = $1('.scene')
const timelineEl = $1('.timeline')
const timebarEl = $1('.timebar')
const timebarPointerEl = $1('.timebar-pointer')
const framebarEl = $1('.framebar')
const paramsEl = $1('.params')
const positionXInputEl = $1('.param-position > .param-input1')
const positionYInputEl = $1('.param-position > .param-input2')
const rotationInputEl = $1('.param-rotation > .param-input')
const rotationCenterXInputEl = $1('.param-rotation-center > .param-input1')
const rotationCenterYInputEl = $1('.param-rotation-center > .param-input2')
const sizeInputXEl = $1('.param-size > .param-input1')
const sizeInputYEl = $1('.param-size > .param-input2')
const repeatModeButtonEl = $1('.repeat-mode-button')
const playPauseButtonEl = $1('.play-pause-button')
const stopButtonEl = $1('.stop-button')
const animationDurationInputEl = $1('.animation-duration-input')
const dragNDropOverlayEl = $1('.drag-n-drop-overlay')


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
        files: []
    }
    const imgs = []
    for (const [k, v] of frames) {
        let i
        if (!imgs.includes(v.part.hash)) {
            i = imgs.length
            imgs.push(v.part.hash)
            const file = files.get(v.part.hash)
            const filename = i + (imageTypeExts[file.type][0] ?? '.wtf')
            animation.files.push(filename)
            zip.file(filename, file.buf)
        }
        else i = imgs.indexOf(v.part.hash)
        
        animation.parts.push([i, [...v.frames].map(x => [x[0], [x[1].pos.x, x[1].pos.y, x[1].rotation, x[1].rotationCenter.x, x[1].rotationCenter.y, x[1].size.x, x[1].size.y]])])
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
    const name2hash = new Map
    await Promise.all([...Object.keys(data.files)].map((k) => (async () => {
        const f = data.files[k]
        const ext = f.name.match(/\.[^\.]*$/)?.[0].toLowerCase()
        if (f.name == 'animation.json') {
            animation = JSON.parse(await f.async('text'))
        }
        if (Object.values(imageTypeExts).flat().includes(ext)) {
            const buf = await f.async('arraybuffer')
            const type = Object.entries(imageTypeExts).find(x => x[1].includes(ext))[0]
            const blob = new Blob([buf], { type })
            const url = URL.createObjectURL(blob)
            const hash = await calculateChecksum(buf)
            const img = await loadImage(url)
            name2hash.set(f.name, hash)
            files.set(hash, { buf, url, type, img })
        }
    })()))
    
    frames.clear()
    for (const [k, v] of framePointEls) v.remove()
    framePointEls.clear()
    for (const p of parts) p.el.remove()
    parts = []
    let counter = 0
    for (const part of animation.parts) {
        const fileIdx = part[0]
        const fileName = animation.files[fileIdx]
        const fileHash = name2hash.get(fileName)
        const file = files.get(fileHash)
        const i = counter++
        const _frames = new Map(part[1].map(x => [x[0], {
            pos: Vec2(x[1][0], x[1][1]),
            rotation: x[1][2],
            rotationCenter: Vec2(x[1][3], x[1][4]),
            size: Vec2(x[1][5], x[1][6])
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
            size: vals[i].size.copy()
        })
    }
}

function addFrame() {

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


// const zip = new JSZip()
// zip.file('hello.txt', 'Hello, World!')
// const link = document.createElement('a')
// link.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }))
// link.download = 'example.zip'
// link.click()

function createFrame(pos, cfg) {
    // const frameEl = $el('div', { class: 'framebar-point' })
    // frameEl.on('click', e => {
    //     setAnimationPosition(pos) // Исправить чтобы я мог repositionFrame()
    // })
    // frameEl.on('contextmenu', e => {
    //     e.preventDefault()
    //     const el = framePointEls.get(pos) // Исправить чтобы я мог repositionFrame()
    //     el.remove()
    //     framePointEls.delete(pos) // Исправить чтобы я мог repositionFrame()
    //     for (const [k, f] of frames) {
    //         f.frames.delete(pos) // Исправить чтобы я мог repositionFrame()
    //     }
    //     setAnimationPosition(currentAnimationPos)
    // })
    // frameEl.style.left = `${pos * 100}%`
    // framebarEl.appendChild(frameEl)
    // framePointEls.set(pos, frameEl)

    // for (const i in parts) {
    //     const p = parts[i]
    //     if (!frames.has(i)) {
    //         const ff = new Map
    //         frames.set(i, {
    //             part: p,
    //             frames: ff
    //         })
    //         p.frames = ff
    //     }
    //     const f = frames.get(i)
    //     // Задавать из соседних штучек
    //     // if (!f.frames.has(pos))
    //     f.frames.set(pos, {
    //         pos: p.pos.copy(),
    //         rotation: p.rotation,
    //         rotationCenter: p.rotationCenter.copy(),
    //         size: p.size.copy()
    //     })
    // }

}

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
            size: p.size.copy()
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
loop(async () => {
    await sleep(1 / 60)
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
    // if () 
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
    cfg.size ??= Vec2(img.width, img.height)
    const el = me.el = $el('div', {
        style: {
            background: `url(${file.url})`,
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
            width: img.width + 'px',
            height: img.height + 'px',
            cursor: 'move'
        }
    })
    me.frames = new Map
    me.hash = hash
    me.img = img
    me.rotation = cfg.rotation
    me.rotationCenter = cfg.rotationCenter
    me.pos = cfg.pos
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
        const { el, rotation, pos, size, rotationCenter } = me
        el.style.width = `${size.x}px`
        el.style.height = `${size.y}px`
        // el.style.transform = `translate(${pos.x - size.x / 2}px, ${pos.y - size.y / 2}px) rotate(${rotation / Math.PI * 180}deg)`
        el.style.transform = `translate(${pos.x - size.x / 2}px, ${pos.y - size.y / 2}px) translate(${rotationCenter.x}px,${rotationCenter.y}px) rotate(${rotation / Math.PI * 180}deg) translate(${-rotationCenter.x}px,${-rotationCenter.y}px)`
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
// const parts = [
//     await loadImage('leg1.png'),
//     await loadImage('leg2.png'),
//     await loadImage('body.png')
// ].map(createPart)


let el1, el2, el3 = $el('div', {
    style: {
        visibility: 'hidden',
        pointerEvents: 'none',
        cursor: 'none'
    },
    child: el2 = $el('div', {
        style: {
            background: '#0003',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            margin: '30px',
            cursor: 'none'
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
        cursor: 'grab'
    }
})



function renderEl3() {
    const { pos, size, rotation, rotationCenter } = selectedPart
    el1.style.width = `${size.x}px`
    el1.style.height = `${size.y}px`
    el3.style.transform = `translate(${pos.x - size.x / 2 - 12 - 30}px, ${pos.y - size.y / 2 - 12 - 30}px) translate(${rotationCenter.x}px,${rotationCenter.y}px) rotate(${rotation / Math.PI * 180}deg) translate(${-rotationCenter.x}px,${-rotationCenter.y}px)`
    el4.style.transform = `translate(${pos.x + rotationCenter.x - 7}px, ${pos.y + rotationCenter.y - 7}px)`

    positionXInputEl.innerText = pos.x.toFixed(2)
    positionYInputEl.innerText = pos.y.toFixed(2)
    rotationInputEl.innerText = (rotation / Math.PI * 180).toFixed(2)
    rotationCenterXInputEl.innerText = rotationCenter.x.toFixed(2)
    rotationCenterYInputEl.innerText = rotationCenter.y.toFixed(2)
    sizeInputXEl.innerText = size.x.toFixed(2)
    sizeInputYEl.innerText = size.y.toFixed(2)
}


function lox(el, cb, getv) {
    const cb2 = () => {
        console.log(123)
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
        console.log(animationDuration)
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
    const sz = size.added(24, 24)
    const r = {
        left:   pos.x - sz.x / 2,
        right:  pos.x + sz.x / 2,
        top:    pos.y - sz.y / 2,
        bottom: pos.y + sz.y / 2
    }
    const m = Vec2(e.clientX, e.clientY)
        .sub(r1.left, r1.top)
        .sub(pos).sub(rotationCenter)
        .rotate(rotation)
        .add(pos).add(rotationCenter)
    resizingDirection.x = ((r.right - m.x) <= 12) ? 1 : (((m.x - r.left) < 12) ? -1 : 0)
    resizingDirection.y = ((r.bottom - m.y) <= 12) ? 1 : (((m.y - r.top) < 12) ? -1 : 0)
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
        max((resizeStartSize.x + v3.x * resizingDirection.x), 1),
        max((resizeStartSize.y + v3.y * resizingDirection.y), 1)
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
    if (e.target == el2) {
        const { pos, size, rotation, rotationCenter } = selectedPart
        const r1 = sceneEl.getBoundingClientRect()
        const sz = size.added(24, 24)
        const r = {
            left:   pos.x - sz.x / 2,
            right:  pos.x + sz.x / 2,
            top:    pos.y - sz.y / 2,
            bottom: pos.y + sz.y / 2
        }
        const m = Vec2(e.clientX, e.clientY)
            .sub(r1.left, r1.top)
            .sub(pos).sub(rotationCenter)
            .rotate(rotation)
            .add(pos).add(rotationCenter)
        const v = Vec2(
            ((r.right - m.x) <= 12) ? 1 : (((m.x - r.left) < 12) ? -1 : 0),
            ((r.bottom - m.y) <= 12) ? 1 : (((m.y - r.top) < 12) ? -1 : 0)
        )
        el6.style.transform = `translate(${e.clientX - r1.left}px, ${e.clientY - r1.top}px) translate(-50%, -50%) rotate(${(-v.angle()+rotation)/Math.PI*180+90}deg)`
        el6.style.visibility = 'visible'
    }
    else {
        el6.style.visibility = 'hidden'
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

const el6 = $el('div', {
    style: {
        background: `url(./resize-cursor.png)`,
        transform: 'translate(-50%, -50%)',
        backgroundSize: '100% 100%',
        width: '23px',
        height: '9px',
        zIndex: '100',
        visibility: 'hidden',
        pointerEvents: 'none'
    }
})
sceneEl.prepend(el6)
const el7 = $el('div', {
    style: {
        background: `url(./rotate-cursor.png)`,
        transform: 'translate(-50%, -50%)',
        backgroundSize: '100% 100%',
        width: '42px',
        height: '12px',
        zIndex: '100',
        visibility: 'hidden',
        pointerEvents: 'none'
    }
})
sceneEl.prepend(el7)


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
    if (e.target == el3) {
        const { pos, size, rotation, rotationCenter } = selectedPart
        const r1 = sceneEl.getBoundingClientRect()
        
        el7.style.transform = `translate(${e.clientX - r1.left}px, ${e.clientY - r1.top}px) translate(-50%, -50%) rotate(${-pos.added(rotationCenter).angleTo(Vec2(e.clientX - r1.left, e.clientY - r1.top))/Math.PI*180+180}deg)`
        el7.style.visibility = 'visible'
    }
    else {
        el7.style.visibility = 'hidden'
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

// function point(x, y) {
//     const pointEl = $el('div', {
//         style: {
//             background: `url(./point.png)`,
//             backgroundSize: '100% 100%',
//             imageRendering: 'pixelated',
//             left: (x - 10) + 'px',
//             top: (y - 10) + 'px',
//             width: '20px',
//             height: '20px',
//             zIndex: '100'
//         }
//     })
//     let o = 1
//     const intervalId = setInterval(() => {
//         o = max(o - (1 / 60), 0)
//         pointEl.style.opacity = o
//     }, 1000 / 60)
//     setTimeout(() => {
//         clearInterval(intervalId)
//         pointEl.remove()
//     }, 1000)
//     sceneEl.appendChild(pointEl)
// }

createAutoFrameAt(0)

// TODO важное: Сделать ли смену удаление и добавление изображений и как?
// Ответ: сделать, но так чтобы можно легко конвертировать в формат всегдасуществования картинок