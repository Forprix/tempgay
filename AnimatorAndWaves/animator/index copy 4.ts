// @ts-nocheck

import { $1, $el, loadImage, floor, round, abs, sign, max, lerp, loop, sleep, clamp, random } from '../util.js'
import Vec2 from '../vec2.js'
import './jszip.js'

// const $ = Object.fromEntries($('[id]').map(x => [x.id.split('-').map((v, i) => i == 0 ? v : v[0].toUpperCase() + v.slice(1)).join(''), x]))

const sceneWrapperEl            = $1('#scene-wrapper')
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
const imageIndexInputEl         = $1('.param-image-index > .param-input')

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
        if (selectedPart == null) return
        selectedPart.remove()
        selectedPart.el.remove()
        parts.delete(selectedPart)
        for (const [t, vs] of frames) vs.frames.delete(selectedPart)
        selectPart(null)
        // TODO: Если изображение не юзается ни одним партом, отгрузить его из files
    }
})

const frames = new Map

on('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
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
    const imgs = new Set
    const allParts = new Set
    for (const [k, v] of frames)
        for (const [part, frameValues] of v.frames) {
            allParts.add(part)
            const fv = frameValues
            if (!imgs.has(fv.imgIdx)) {
                imgs.add(fv.imgIdx)
                const file = files.get(fv.imgIdx)
                const filename = fv.imgIdx + (imageTypeExts[file.type][0] ?? '.wtf')
                zip.file(filename, file.buf)
            }
        }
    for (const p of allParts) {
        animation.parts.push([...p.frames].map(x => [x[0], [x[1].pos.x, x[1].pos.y, x[1].rotation, x[1].rotationCenter.x, x[1].rotationCenter.y, x[1].size.x, x[1].size.y, x[1].z, x[1].imgIdx]]))
    }
    zip.file('animation.json', JSON.stringify(animation))
    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'animation.zip'
    link.click()
}

async function loadAnimation(buf) {
    setPlaying(false)
    const zip = new JSZip()
    const data = await zip.loadAsync(buf)
    if (!('animation.json' in data.files)) return false
    for (const [k, f] of files) URL.revokeObjectURL(f.url)
    files.clear()
    let animation
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
            const hash = await crc32(buf)
            const img = await loadImage(url)
            const idx = Number(f.name.replace(/\.[^\.]*$/, ''))
            files.set(idx, { buf, hash, url, type, img })
        }
    })()))

    repeatModeButtonEl.style.background = `center/100% 100% url(./${animation.loopMode}.svg)`
    repeatMode = animation.loopMode
    
    animationDurationInputEl.innerText = animation.duration.toFixed(1)
    animationDuration = animation.duration
    
    for (const [p, f] of frames) f.remove()
    frames.clear()
    for (const p of parts) {
        p.remove()
        p.el.remove()
    }
    parts.clear()
    let counter = 0
    for (const part of animation.parts) {
        const i = counter++
        const partFrames = new Map(part.map(x => [x[0], {
            pos:            Vec2(x[1][0], x[1][1]),
            rotation:       x[1][2],
            rotationCenter: Vec2(x[1][3], x[1][4]),
            size:           Vec2(x[1][5], x[1][6]),
            z:              x[1][7],
            imgIdx:         x[1][8]
        }]))
        const _part = createPart({ frames: partFrames })
        parts.add(_part)
    }
    if (animation.parts.length > 0) {
        for (const [pos, p] of animation.parts[0]) {
            const values = new Map
            for (const p of parts) values.set(p, p.frames.get(pos))
            setFrame(pos, values)
        }
    }

    selectPart(null)
    setAnimationPosition(0)
}


on('dragover', e => {
    e.preventDefault()
    dragNDropOverlayEl.classList.remove('hidden')
})
on('dragleave', () => {
    dragNDropOverlayEl.classList.add('hidden')
})

// TODO: Чекать контрольную сумму не по байтам файла, а по пикселям 
const crc32 = (() => {
    const tbl = new Uint32Array([
        0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f,
        0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988,
        0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2,
        0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
        0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
        0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172,
        0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c,
        0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
        0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423,
        0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
        0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106,
        0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
        0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d,
        0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
        0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
        0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
        0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7,
        0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0,
        0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa,
        0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
        0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81,
        0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a,
        0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84,
        0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
        0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
        0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc,
        0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e,
        0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
        0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55,
        0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
        0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28,
        0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
        0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f,
        0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38,
        0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
        0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
        0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69,
        0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2,
        0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc,
        0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
        0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693,
        0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
        0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
    ])

    return ab => {
        ab = new Uint8Array(ab)
        var crc = 0 ^ (-1);
        for(var i = 0; i < ab.length; i++)
            crc = (crc >>> 8) ^ tbl[(crc ^ ab[i]) & 0xFF]
        return (crc ^ (-1)) >>> 0
    }
})()
const files = new Map()

async function tryAddImage(buf, type) {
    const hash = crc32(buf)
    const existing = [...files.entries()].find(x => x[1].hash == hash)
    let idx, exi
    if (existing == null) {
        const blob = new Blob([buf], { type })
        const url = URL.createObjectURL(blob)
        idx = files.size
        files.set(idx, exi = { buf, hash, url, type, img: await loadImage(url) })
    }
    else {
        idx = existing[0]
        exi = existing[1]
    }
    parts.add(createPart({ imgIdx: idx, size: Vec2(exi.img.width, exi.img.height)}))
    setFrame(currentAnimationPos, 'auto')
    setAnimationPosition(currentAnimationPos)
}


on('drop', async e => {
    e.preventDefault()
    dragNDropOverlayEl.classList.add('hidden')
    const _files = e.dataTransfer.files
    await Promise.all([..._files].map(file => (async () => {
        const ext = file.name.match(/\.[^\.]*$/)?.[0].toLowerCase()
        if ((file.type in imageTypeExts) || Object.values(imageTypeExts).flat().includes(ext)) {
            await tryAddImage(await file.arrayBuffer(), file.type)
        }
        if (ext == '.zip') {
            // TODO: allow only single zip load
            await loadAnimation(await file.arrayBuffer())
        }
    })()))
})

let frameTimes = new Map

function getAutoVals(pos, vals, k) {
    let tr
    let lowt = -Infinity
    let hight = Infinity
    for (const [k, v] of frames) {
        if (k <= pos && lowt < k) lowt = k
        if (k >= pos && hight > k) hight = k
    }
    if (hight == Infinity) hight = lowt
    if (lowt == -Infinity) lowt = hight
    const progress = lowt == hight ? 0 : (pos - lowt) / (hight - lowt)

    const f1 = k.frames.get(lowt)
    const f2 = k.frames.get(hight)
    if (f1 != null && f2 != null) {
        tr = { }
        tr.pos = Vec2(lerp(progress, f1.pos.x, f2.pos.x), lerp(progress, f1.pos.y, f2.pos.y))
        tr.rotation = lerp(progress, f1.rotation, f2.rotation)
        tr.rotationCenter = Vec2(lerp(progress, f1.rotationCenter.x, f2.rotationCenter.x), lerp(progress, f1.rotationCenter.y, f2.rotationCenter.y))
        tr.size = Vec2(lerp(progress, f1.size.x, f2.size.x), lerp(progress, f1.size.y, f2.size.y))
        tr.z = lerp(progress, f1.z, f2.z)
        tr.imgIdx = f1.imgIdx
    }
    tr ??= k
    return tr
}
function createFrame(pos, vals) {
    const me = {
        frames: new Map
    }
    const frameEl = me.el = $el('div', { class: 'framebar-point' })
    const xyu = Symbol()
    frameEl.on('click', e => {
        const _pos = frameTimes.get(me)
        setAnimationPosition(_pos)
    })
    frameTimes.set(me, pos)
    let draggingFrame = false
    let draggingOffset = 0
    frameEl.on('mousedown', e => {
        draggingFrame = true
        const r = frameEl.getBoundingClientRect()
        draggingOffset = (e.clientX - (r.left + r.right) / 2)
    })
    const lsn1 = e => {
        if (!draggingFrame) return
        const r = framebarEl.getBoundingClientRect()
        const newPos = (((e.clientX - draggingOffset) - r.left) / r.width)
        const ef = frames.get(newPos)
        if (ef != null) return
        const oldPos = frameTimes.get(me)
        
        // frames
        frames.delete(oldPos)
        frames.set(newPos, me)

        // parts
        for (const p of parts) {
            const v = p.frames.get(oldPos)
            p.frames.delete(oldPos)
            p.frames.set(newPos, v)
        }

        // frameTimes
        frameTimes.set(me, newPos)


        frameEl.style.left = `${newPos * 100}%`
    }
    const lsn2 = e => {
        if (!draggingFrame) return
        draggingFrame = false
    }
    on('mousemove', lsn1)
    on('mouseup', lsn2)
    frameEl.on('contextmenu', e => {
        e.preventDefault()
        frameEl.remove()
        const _pos = frameTimes.get(me)
        frames.delete(_pos)
        for (const p of parts) p.frames.delete(_pos)
        setAnimationPosition(currentAnimationPos)
    })
    frameEl.style.left = `${pos * 100}%`
    framebarEl.appendChild(frameEl)

    me.remove = () => {
        frameTimes.delete(me)
        frameEl.remove()
        off('mousemove', lsn1)
        off('mouseup', lsn2)
    }

    for (const p of parts) {
        if (!p.frames.has(pos)) p.frames.set(pos, {})
        const obj = p.frames.get(pos)
        const tr = vals == 'auto' ? p : vals.get(p)
        obj.pos = tr.pos.copy()
        obj.rotation = tr.rotation
        obj.rotationCenter = tr.rotationCenter.copy()
        obj.size = tr.size.copy()
        obj.z = tr.z
        obj.imgIdx = tr.imgIdx

        const loxs = me.frames
        let ob = loxs.get(p)
        if (ob == null) loxs.set(p, ob = obj)
    }
    return me
}
function setFrame(pos, vals) {
    let r
    if (!frames.has(pos)) {
        if (vals == 'auto') {
            let lowt = -Infinity
            let hight = Infinity
            for (const [k, v] of frames) {
                if (k <= pos && lowt < k) lowt = k
                if (k >= pos && hight > k) hight = k
            }
            if (hight == Infinity) hight = lowt
            if (lowt == -Infinity) lowt = hight
            const progress = lowt == hight ? 0 : (pos - lowt) / (hight - lowt)

            if (isFinite(hight)) {
                vals = new Map
                for (const p of parts) {
                    const f1 = p.frames.get(lowt)
                    const f2 = p.frames.get(hight)
                    let tr = { }
                    tr.pos = Vec2(lerp(progress, f1.pos.x, f2.pos.x), lerp(progress, f1.pos.y, f2.pos.y))
                    tr.rotation = lerp(progress, f1.rotation, f2.rotation)
                    tr.rotationCenter = Vec2(lerp(progress, f1.rotationCenter.x, f2.rotationCenter.x), lerp(progress, f1.rotationCenter.y, f2.rotationCenter.y))
                    tr.size = Vec2(lerp(progress, f1.size.x, f2.size.x), lerp(progress, f1.size.y, f2.size.y))
                    tr.z = lerp(progress, f1.z, f2.z)
                    tr.imgIdx = f1.imgIdx
                    vals.set(p, tr)
                }
            }
        }
        frames.set(pos, r = createFrame(pos, vals))
    }
    else {
        r = frames.get(pos)
        const f = r.frames
        for (const [k, v] of f) {
            let tr = vals == 'auto' ? k : vals.get(k)
            v.pos = tr.pos.copy()
            v.rotation = tr.rotation
            v.rotationCenter = tr.rotationCenter.copy()
            v.size = tr.size.copy()
            v.z = tr.z
            v.imgIdx = tr.imgIdx
        }
    }
    return r
}


let currentAnimationPos = 0
function updateCurrentFrameValues() {
    if (playing) return
    const pos = currentAnimationPos
    setFrame(pos, 'auto')
    setAnimationPosition(pos)
}
framebarEl.on('click', e => {
    if (e.target != framebarEl) return
    const rect = framebarEl.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    setFrame(pos, 'auto')
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
    for (const [k, v] of frames) {
        if (k <= pos && lowt < k) lowt = k
        if (k >= pos && hight > k) hight = k
    }
    if (hight == Infinity) hight = lowt
    if (lowt == -Infinity) lowt = hight
    const progress = lowt == hight ? 0 : (pos - lowt) / (hight - lowt)
    for (const p of parts) {
        const f1 = p.frames.get(lowt)
        const f2 = p.frames.get(hight)
        if (f1 != null && f2 != null) {
            p.pos.x = lerp(progress, f1.pos.x, f2.pos.x)
            p.pos.y = lerp(progress, f1.pos.y, f2.pos.y)
            p.rotation = lerp(progress, f1.rotation, f2.rotation)
            p.rotationCenter.x = lerp(progress, f1.rotationCenter.x, f2.rotationCenter.x)
            p.rotationCenter.y = lerp(progress, f1.rotationCenter.y, f2.rotationCenter.y)
            p.size.x = lerp(progress, f1.size.x, f2.size.x)
            p.size.y = lerp(progress, f1.size.y, f2.size.y)
            p.z = lerp(progress, f1.z, f2.z)
            p.imgIdx = f1.imgIdx
        }
        p.render()
        if (selectedPart == p) renderEverything()
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
let rotateRotationMem = Vec2(0, 0)

let movingRotationCenter = false
const
    rotationCenterStartCursorPos = Vec2(0, 0),
    rotationCenterStartRotationCenter = Vec2(0, 0),
    rotationCenterStartPos = Vec2(0, 0)

function createPart(cfg) {
    const me = {}
    cfg ??= {}
    cfg.pos ??= Vec2(0, 0)
    cfg.rotation ??= 0
    cfg.rotationCenter ??= Vec2(0, 0)
    cfg.z ??= 0 // Инкрементировать
    cfg.size ??= Vec2(150, 150)
    cfg.imgIdx ??= 0
    const el = me.el = $el('image', {
        svg: true,
        style: {
            'image-rendering': 'pixelated'
        },
        attrs: {
            transform: 'scale(1 1)'
        },
        class: 'part'
    })

    me.pos = cfg.pos
    me.rotation = cfg.rotation
    me.rotationCenter = cfg.rotationCenter
    me.size = cfg.size
    me.z = cfg.z
    me.imgIdx = cfg.imgIdx
    me.frames = cfg.frames
    
    if (me.frames == null) {
        me.frames = new Map([...frames.keys()].map(x => [x, {
            pos: me.pos.copy(),
            rotation: me.rotation,
            rotationCenter: me.rotationCenter.copy(),
            size: me.size.copy(),
            z: me.z,
            imgIdx: me.imgIdx
        }]))
    }
    for (const [pos, values] of me.frames) {
        let fs = frames.get(pos)
        if (fs == null) {
            const f = setFrame(pos, 'auto')
            fs = f
        }
        fs = fs.frames
        let p = fs.get(me)
        if (p == null) fs.set(me, p = values)
    }

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
        renderEverything()
    }
    const lst1 = e => {
        if (selectedPart?.el != el) return
        if (!dragging) return
        mov_(e)
        dragging = false
    }
    const lst2 = e => {
        if (selectedPart?.el != el) return
        if (!dragging) return
        mov_(e)
        updateCurrentFrameValues()
    }
    on('mouseup', lst1)
    on('mousemove', lst2)
    me.remove = () => {
        off('mouseup', lst1)
        off('mousemove', lst2)
    }
    function render() {
        const { el, rotation, pos, size, rotationCenter, z, imgIdx } = me
        //el.style.background = `center/100% 100% url(${files.get(imgIdx).url})`
        el.setAttribute('href', files.get(imgIdx).url)
        el.setAttribute('preserveAspectRatio', 'none')
        el.setAttribute('width', abs(size.x))
        el.setAttribute('height', abs(size.y))

        const transform = el.transform.baseVal.getItem(0)
        transform.setMatrix(
            sceneWrapperEl.createSVGMatrix()
                .translate(pos.x, pos.y)
                .translate(rotationCenter.x, rotationCenter.y)
                .rotate(rotation / Math.PI * 180)
                .translate(-rotationCenter.x, -rotationCenter.y)
                .scaleNonUniform(sign(size.x), sign(size.y))
                .translate(-abs(size.x) / 2, -abs(size.y) / 2)
        )

        // translate(${rotationCenter.x}px,${rotationCenter.y}px) rotate(${rotation / Math.PI * 180}deg) translate(${-rotationCenter.x}px,${-rotationCenter.y}px)

        // el.style['z-index'] = z + 1000000000
        // el.style.transform = `translate(${pos.x - abs(size.x) / 2}px, ${pos.y - abs(size.y) / 2}px) translate(${rotationCenter.x}px,${rotationCenter.y}px) rotate(${rotation / Math.PI * 180}deg) translate(${-rotationCenter.x}px,${-rotationCenter.y}px) scale(${sign(size.x)}, ${sign(size.y)})`
    }
    me.render = render

    // render()
    sceneEl.append(el)

    return me
}
function asd() {
    throw Error('Dolboeb')
}

on('keydown', e => {
    if (e.code == 'KeyF') {
        console.log(frames)
    }
    if (e.code == 'KeyT') {
        console.log(frameTimes)
    }
    if (e.code == 'KeyP') {
        console.log(parts)
    }
    if (e.code == 'KeyI') {
        console.log(files)
    }
    if (e.code == 'KeyE') {
        asd()
    }
})

let parts = new Set


let el1 = $el('rect', {
    svg: true,
    attrs: {
        fill: '#0003',
        transform: 'scale(1 1)'
    }
})
let el2 = $el('rect', {
    svg: true,
    attrs: {
        fill: '#ffffff03',
        transform: 'scale(1 1)'
    }
})

let el4 = $el('circle', {
    svg: true,
    attrs: {
        r: 6,
        fill: '#0005',
        stroke: '#FFF',
        'stroke-width': 3,
        transform: 'scale(1, 1)'
    },
    class: 'rotationCenter'
})

new ResizeObserver(() => {
    const rect = sceneWrapperEl.getBoundingClientRect()
    sceneEl.transform.baseVal.getItem(0).setTranslate(rect.width / 2, rect.height / 2)
}).observe(sceneWrapperEl)

function renderEverything() {
    if (selectedPart != null) {
        const { pos, size, rotation, rotationCenter, z, imgIdx } = selectedPart
        el1.setAttribute('width', (abs(size.x) + 12*2))
        el1.setAttribute('height', (abs(size.y) + 12*2))
        const transform1 = el1.transform.baseVal.getItem(0)
        transform1.setMatrix(
            sceneWrapperEl.createSVGMatrix()
                .translate(pos.x, pos.y)
                .translate(rotationCenter.x, rotationCenter.y)
                .rotate(rotation / Math.PI * 180)
                .translate(-rotationCenter.x, -rotationCenter.y)
                .translate(-(abs(size.x) / 2 + 12), -(abs(size.y) / 2 + 12))
        )

        
        const transform2 = el2.transform.baseVal.getItem(0)
        el2.setAttribute('width', (abs(size.x) + (12+30)*2))
        el2.setAttribute('height', (abs(size.y) + (12+30)*2))
        transform2.setMatrix(
            sceneWrapperEl.createSVGMatrix()
                .translate(pos.x, pos.y)
                .translate(rotationCenter.x, rotationCenter.y)
                .rotate(rotation / Math.PI * 180)
                .translate(-rotationCenter.x, -rotationCenter.y)
                .translate(-(abs(size.x) / 2 + 12 + 30), -(abs(size.y) / 2 + 12 + 30))
        )


        const transform4 = el4.transform.baseVal.getItem(0)
        transform4.setMatrix(
            sceneWrapperEl.createSVGMatrix()
                .translate(pos.x + rotationCenter.x, pos.y + rotationCenter.y)
        )
        
        // el4.style['z-index'] = z + 1000000000 + 1
        // el3.style['z-index'] = z + 1000000000

        positionXInputEl.innerText = pos.x.toFixed(2)
        positionYInputEl.innerText = pos.y.toFixed(2)
        rotationInputEl.innerText = (rotation / Math.PI * 180).toFixed(2)
        rotationCenterXInputEl.innerText = rotationCenter.x.toFixed(2)
        rotationCenterYInputEl.innerText = rotationCenter.y.toFixed(2)
        sizeInputXEl.innerText = size.x.toFixed(2)
        sizeInputYEl.innerText = size.y.toFixed(2)
        zIndexInputEl.innerText = z.toFixed(2)
        imageIndexInputEl.innerText = floor(imgIdx)
    }
    for (const p of [...parts].toSorted((a, b) => a.z - b.z)) {
        sceneEl.appendChild(p.el)
    }
    if (selectedPart != null) {
        sceneEl.append(selectedPart.el)
        sceneEl.insertBefore(el2, selectedPart.el)
        sceneEl.insertBefore(el1, selectedPart.el)
        sceneEl.append(el4)
    }
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
                renderEverything()
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
lox(imageIndexInputEl, v => selectedPart.imgIdx = floor(v), () => floor(selectedPart.imgIdx))

let selectedPart
function selectPart(part) {
    if (part != null && part == selectedPart) return
    selectedPart = part
    if (selectedPart == null) {
        paramsEl.style.visibility = 'hidden'
        el1.remove()
        el2.remove()
        el4.remove()
        setCursor(1, null)
        setCursor(2, null)
        renderEverything()
        return
    }
    paramsEl.style.visibility = 'visible'

    renderEverything()
    
    


}
el1.on('mousedown', e => {
    if (e.target != el1) return

    if (selectedPart == null) return
    resizing = true
    const { pos, size, rotation, rotationCenter } = selectedPart
    const r1 = sceneWrapperEl.getBoundingClientRect()
    const r = {
        left:   pos.x - (abs(size.x) + 24) / 2,
        right:  pos.x + (abs(size.x) + 24) / 2,
        top:    pos.y - (abs(size.y) + 24) / 2,
        bottom: pos.y + (abs(size.y) + 24) / 2
    }
    const m = Vec2(e.clientX - r1.left - r1.width / 2, e.clientY - r1.top - r1.height / 2)
        .sub(pos).sub(rotationCenter)
        .rotate(rotation)
        .add(pos).add(rotationCenter)
    resizingDirection.x = (((r.right - m.x) <= 12) ? 1 : (((m.x - r.left) < 12) ? -1 : 0)) * sign(size.x)
    resizingDirection.y = (((r.bottom - m.y) <= 12) ? 1 : (((m.y - r.top) < 12) ? -1 : 0)) * sign(size.y)
    resizing = true
    resizeStartPos.set(pos)
    resizeStartSize.set(size)
    resizeStartMousePos.set(e.clientX - r1.left - r1.width / 2, e.clientY - r1.top - r1.height / 2)
})
function siz_(e) {
    const { pos, size, rotation } = selectedPart
    const r1 = sceneWrapperEl.getBoundingClientRect()
    // Alt Sizing
    // Shift Sizing
    // Alt + Shift Sizing
    // Shift Rotating
    const cursor = Vec2(
        e.clientX - r1.left - r1.width / 2,
        e.clientY - r1.top - r1.height / 2
    )
    const cursorDelta = Vec2(
        (cursor.x - resizeStartMousePos.x),
        (cursor.y - resizeStartMousePos.y)
    )
    const rotatedCursorDelta = cursorDelta.rotated(rotation)
    if (!e.shiftKey) { // Без шифта всё работает идеально!!!
        const directedCursorDelta = 
        rotatedCursorDelta.mulled(
            abs(resizingDirection.x),
            abs(resizingDirection.y)
        ).rotate(-rotation)
        if (e.altKey) {
            pos.set(resizeStartPos)
            rotatedCursorDelta.mul(2, 2)
        }
        else {
            pos.set(
                resizeStartPos.x + directedCursorDelta.x / 2,
                resizeStartPos.y + directedCursorDelta.y / 2
            )
        } 
        size.set(
            (resizeStartSize.x + rotatedCursorDelta.x * resizingDirection.x),
            (resizeStartSize.y + rotatedCursorDelta.y * resizingDirection.y)
        )
        return
    }
    else {
        if (e.altKey) {
            const rotatedCursorDelta1 = rotatedCursorDelta.copy()
            rotatedCursorDelta1.x *= resizingDirection.x
            rotatedCursorDelta1.y = (rotatedCursorDelta1.x * (resizeStartSize.y / resizeStartSize.x))
            rotatedCursorDelta1.mul(2, 2)
            const a = (resizeStartSize.y + rotatedCursorDelta1.y) / resizeStartSize.y

            const rotatedCursorDelta2 = rotatedCursorDelta.copy()
            rotatedCursorDelta2.y *= resizingDirection.y
            rotatedCursorDelta2.x = (rotatedCursorDelta2.y * (resizeStartSize.x / resizeStartSize.y)) 
            rotatedCursorDelta2.mul(2, 2)
            const b = (resizeStartSize.x + rotatedCursorDelta2.x) / resizeStartSize.x

            if (abs(a) > abs(b)) {
                rotatedCursorDelta.y *= resizingDirection.y
                rotatedCursorDelta.x = (rotatedCursorDelta.y * (resizeStartSize.x / resizeStartSize.y))
            }
            else {
                rotatedCursorDelta.x *= resizingDirection.x
                rotatedCursorDelta.y = (rotatedCursorDelta.x * (resizeStartSize.y / resizeStartSize.x))
            }
            rotatedCursorDelta.mul(2, 2)
            size.set(
                abs(resizeStartSize.x + rotatedCursorDelta.x) * sign(resizeStartSize.x) * sign(a),
                abs(resizeStartSize.y + rotatedCursorDelta.y) * sign(resizeStartSize.y) * sign(b)
            )
        }
        else {
            if (abs(resizingDirection.x) == 1 && resizingDirection.y == 0) {
                rotatedCursorDelta.x *= sign(resizingDirection.x)
                rotatedCursorDelta.y = (rotatedCursorDelta.x * (resizeStartSize.y / resizeStartSize.x))
                rotatedCursorDelta.div(2, 2)
                pos.set(
                    resizeStartPos.added(
                        Vec2(
                            rotatedCursorDelta.x * sign(resizingDirection.x),
                            0
                        ).rotate(-rotation)
                    )
                )
                rotatedCursorDelta.mul(2, 2)
                size.set(
                    (resizeStartSize.x + rotatedCursorDelta.x),
                    abs(resizeStartSize.y + rotatedCursorDelta.y) * sign(resizeStartSize.y)
                )
            }
            else if (resizingDirection.x == 0 && abs(resizingDirection.y) == 1) {
                rotatedCursorDelta.y *= sign(resizingDirection.y)
                rotatedCursorDelta.x = (rotatedCursorDelta.y * (resizeStartSize.x / resizeStartSize.y))
                rotatedCursorDelta.div(2, 2)
                pos.set(
                    resizeStartPos.added(
                        Vec2(
                            0,
                            rotatedCursorDelta.y * sign(resizingDirection.y)
                        ).rotate(-rotation)
                    )
                )
                rotatedCursorDelta.mul(2, 2)
                size.set(
                    abs(resizeStartSize.x + rotatedCursorDelta.x) * sign(resizeStartSize.x),
                    (resizeStartSize.y + rotatedCursorDelta.y)
                )
            }
            else if (abs(resizingDirection.x) == 1 && abs(resizingDirection.y) == 1) {
                const rotatedCursorDelta1 = rotatedCursorDelta.copy()
                rotatedCursorDelta1.x *= resizingDirection.x
                rotatedCursorDelta1.y = (rotatedCursorDelta1.x * (resizeStartSize.y / resizeStartSize.x))
                const a = (resizeStartSize.y + rotatedCursorDelta1.y) / resizeStartSize.y
    
                const rotatedCursorDelta2 = rotatedCursorDelta.copy()
                rotatedCursorDelta2.y *= resizingDirection.y
                rotatedCursorDelta2.x = (rotatedCursorDelta2.y * (resizeStartSize.x / resizeStartSize.y)) 
                const b = (resizeStartSize.x + rotatedCursorDelta2.x) / resizeStartSize.x
    
                if (abs(a) > abs(b)) {
                    rotatedCursorDelta.y *= resizingDirection.y
                    rotatedCursorDelta.x = (rotatedCursorDelta.y * (resizeStartSize.x / resizeStartSize.y))
                }
                else {
                    rotatedCursorDelta.x *= resizingDirection.x
                    rotatedCursorDelta.y = (rotatedCursorDelta.x * (resizeStartSize.y / resizeStartSize.x))
                }
                rotatedCursorDelta.div(2, 2)
                pos.set(
                    resizeStartPos.added(
                        Vec2(
                            rotatedCursorDelta.x * sign(resizingDirection.x),
                            rotatedCursorDelta.y * sign(resizingDirection.y)
                        ).rotate(-rotation)
                    )
                )
                rotatedCursorDelta.mul(2, 2)
                size.set(
                    abs(resizeStartSize.x + rotatedCursorDelta.x) * sign(resizeStartSize.x) * sign(a),
                    abs(resizeStartSize.y + rotatedCursorDelta.y) * sign(resizeStartSize.y) * sign(b)
                )

            }
        }
    }
    
    selectedPart.render()
    renderEverything()
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
    if (!rotating && (resizing || e.target == el1)) {
        const { pos, size, rotation, rotationCenter } = selectedPart
        const r1 = sceneWrapperEl.getBoundingClientRect()
        const r = {
            left:   pos.x - (abs(size.x) + 24) / 2,
            right:  pos.x + (abs(size.x) + 24) / 2,
            top:    pos.y - (abs(size.y) + 24) / 2,
            bottom: pos.y + (abs(size.y) + 24) / 2
        }

        const m = Vec2(e.clientX - r1.left - r1.width / 2, e.clientY - r1.top - r1.height / 2)
            .sub(r1.left, r1.top)
            .sub(pos).sub(rotationCenter)
            .rotate(rotation)
            .add(pos).add(rotationCenter)
        const v = Vec2(
            (((r.right - m.x) <= 12) ? 1 : (((m.x - r.left) < 12) ? -1 : 0)),
            (((r.bottom - m.y) <= 12) ? 1 : (((m.y - r.top) < 12) ? -1 : 0))
        )
        const angle = `${(-v.angle()+rotation)/Math.PI*180+90}`
        setCursor(1, angle)
    }
    else {
        setCursor(1, null)
    }
    
})


let finalRotation = 0
el2.on('mousedown', e => {
    if (e.target != el2) return

    if (selectedPart == null) return
    const { pos, size, rotation, rotationCenter } = selectedPart
    rotating = true
    const r = sceneWrapperEl.getBoundingClientRect()
    rotateRotationMem.set(
        e.clientX - r.left - (pos.x + rotationCenter.x) - r.width / 2,
        e.clientY - r.top - (pos.y + rotationCenter.y) - r.height / 2
    )
    finalRotation = selectedPart.rotation
})

function rot_(e) {
    const { pos, size, rotationCenter } = selectedPart
    const r = sceneWrapperEl.getBoundingClientRect()
    const p = pos.added(rotationCenter)
    let newMem = Vec2(e.clientX - r.left - (pos.x + rotationCenter.x) - r.width / 2, e.clientY - r.top - (pos.y + rotationCenter.y) - r.height / 2)

    let dt = rotateRotationMem.angle() - newMem.angle()
    
    if (dt > Math.PI)
        dt -= 2 * Math.PI
    else if (dt < -Math.PI)
        dt += 2 * Math.PI

    rotateRotationMem = newMem
    
    finalRotation += dt
    if (e.shiftKey)
        selectedPart.rotation = round(finalRotation / (Math.PI * 2) * 16) / 16 * (Math.PI * 2)
    else
        selectedPart.rotation = finalRotation

    selectedPart.render()
    renderEverything()
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
    if (!resizing && (rotating || e.target == el2)) {
        const { pos, size, rotation, rotationCenter } = selectedPart
        const r1 = sceneWrapperEl.getBoundingClientRect()
        
        const angle = `${-pos.added(rotationCenter).angleTo(Vec2(e.clientX - r1.left - r1.width / 2, e.clientY - r1.top - r1.height / 2))/Math.PI*180}`
        setCursor(2, angle)
    }
    else {
        setCursor(2, null)
    }
})

// TODO: control sum by pixels, not image binary

on('paste', async e => {
    const promises = []
    for (const v of e.clipboardData.items) {
        const f = v.getAsFile()
        promises.push((async () => {
           await tryAddImage(await f.arrayBuffer(), f.type)
        }))
        // TODO: image types
    }
    for (const p of promises) await p()
})

el4.on('mousedown', e => {
    if (e.target != el4) return
    if (selectedPart == null) return
    const { rotationCenter, pos } = selectedPart
    movingRotationCenter = true
    const r = sceneWrapperEl.getBoundingClientRect()
    rotationCenterStartCursorPos.set(e.clientX - r.left, e.clientY - r.top)
    rotationCenterStartRotationCenter.set(rotationCenter)
    rotationCenterStartPos.set(pos)
})
function rtc_(e) {
    const { rotation, pos } = selectedPart
    const r = sceneWrapperEl.getBoundingClientRect()
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
    renderEverything()
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

const centerCross1El = $el('rect', { svg: true, attrs: { height: '2.5', fill: '#00000045' } })
const centerCross2El = $el('rect', { svg: true, attrs: { width: '2.5', fill: '#00000045' } })
sceneEl.prepend(centerCross1El, centerCross2El)
new ResizeObserver(() => {
    const rect = sceneWrapperEl.getBoundingClientRect()
    centerCross1El.setAttribute('width', rect.width)
    centerCross2El.setAttribute('height', rect.height)
    centerCross1El.setAttribute('x', -rect.width / 2)
    centerCross2El.setAttribute('y', -rect.height / 2)
}).observe(sceneWrapperEl)

selectPart(null)
on('mousedown', e => {
    if (e.target == sceneWrapperEl) selectPart(null)
})

// createParser({ parts: arr(map(f64, { position: f64[2], rotation: f64, rotationCenter: f64[2], size: f64[2], zIndex: f64, imageIndex: i32 })) })

// Сделать смену изображений и список изображений с заменой при dragndrop
// Масштабирование с Shift
// Ctrl + C, Ctrl + V part-ы

// Нельзя посмотреть список всех картинок чтобы указать нужный Image Index

// Сделано: Сделать Z-Index учитывая систему SVG
// Сделано: SVGфицировать всё
// Сделано: Вернуть полоски
// Сделано: Пофикшен сервер
// Сделано: Брать серединные значения
// Сделано: Передвижение кадров
// Сделано: Ctrl + V изображениябходить лимиты
// Сделано: Кнопка Delete!!! для удаления картинок
// Сделано: Курсоры адекватные (с по
// Сделано: Повороты позволяют омощью cursor: svg)
// Сделано: Z-Index
// Сделано: Скалинг позволяет делать -1
// Сделано: Красивый drag&drop
// Сделано: Сохранять loop-mode и duration
