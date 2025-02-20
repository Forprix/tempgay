import { $, $1, $el, $url, $hsv2rgb, $shuffle, $download } from '/util.mjs'

(async () => {

const soundCache = new Map()

const chunksInfo = await (await fetch('https://raw.githubusercontent.com/Forprix/Meme-Sounds/main/chunks.json')).json()

const soundListEl = $1('.sound-list')
const bodyEl = $1('body')

const frame = () => {
    const rgb = $hsv2rgb([performance.now() / 1000 * 360 % 360, 50, 100])
    bodyEl.style = `--rainbow: rgb(${Math.floor(rgb[0])}, ${Math.floor(rgb[1])}, ${Math.floor(rgb[2])})`
    requestAnimationFrame(frame)
}
frame()

let dragging = false
let dragX = 0
let dragY = 0
let posX = 0
let posY = 0
let loxX = 0
let loxY = 0

let offsetX = 0
let offsetY = 0
let sizeX = 0
let sizeY = 0

let moved = false

function magicIfNeeded() {
    const rect = bodyEl.getBoundingClientRect()
    const gigaX = loxX + offsetX
    const gigaY = loxY + offsetY
    
    const rectArg = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    }

    const rightPencil = (loxX + offsetX + sizeX * 150) - rect.width
    const bottomPencil = (loxY + offsetY + sizeY * 200) - rect.height
    const rightRem = Math.floor(rightPencil / 150)
    if (rightRem > 0)
        rectArg.right -= rightRem
    const bottomRem = Math.floor(bottomPencil / 200)
    if (bottomRem > 0)
        rectArg.bottom -= bottomRem
    const leftRem = Math.floor(-gigaX / 150)
    if (leftRem > 0)
        rectArg.left -= leftRem
    const topRem = Math.floor(-gigaY / 200)
    if (topRem > 0)
        rectArg.top -= topRem

    const leftAdd = Math.ceil(gigaX / 150)
    if (leftAdd > 0)
        rectArg.left += leftAdd
    const topAdd = Math.ceil(gigaY / 200)
    if (topAdd > 0)
        rectArg.top += topAdd
    const rightAdd = Math.ceil(-rightPencil / 150)
    if (rightAdd > 0)
        rectArg.right += rightAdd
    const bottomAdd = Math.ceil(-bottomPencil / 200)
    if (bottomAdd > 0)
        rectArg.bottom += bottomAdd

    magic(rectArg)
}

const downHandler = e => {
    if (e.touches && e.touches.length > 1) return
    const {clientX, clientY} = e.touches ? e.touches[0] : e
    if (dragging) {
        posX += clientX - dragX
        posY += clientY - dragY
    }
    dragX = clientX
    dragY = clientY
    dragging = true
}
soundListEl.addEventListener('mousedown', downHandler)
soundListEl.addEventListener('touchstart', downHandler)

const moveHandler = e => {
    if (e.touches && e.touches.length > 1) return
    const {clientX, clientY} = e.touches ? e.touches[0] : e
    if (!dragging) return
    moved = true
    loxX = clientX - dragX + posX
    loxY = clientY - dragY + posY
    soundListEl.style.transform = `translate(${Math.round(loxX + offsetX)}px, ${Math.round(loxY + offsetY)}px)`
}
bodyEl.addEventListener('mousemove', moveHandler)
bodyEl.addEventListener('touchmove', moveHandler)

addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault()
    }
}, { passive: false })

const leaveHandler = e => {
    if (!dragging) return
    dragging = false
    posX = loxX
    posY = loxY
    magicIfNeeded()
}
bodyEl.addEventListener('mouseup', leaveHandler)
bodyEl.addEventListener('mouseleave', leaveHandler)
bodyEl.addEventListener('touchend', leaveHandler)
bodyEl.addEventListener('touchcancel', leaveHandler)

class LazyAudio {
    constructor(src, lazy = true) {
        this.src = src
        if (!lazy)
            this.audio = new Audio(this.src)
    }
    onEnded(callback) {
        this.onended = callback
        if (this.audio)
            this.audio.onended = this.onended
    }
    play() {
        if (!this.audio) {
            this.audio = new Audio(this.src)
            this.audio.onended = this.onended
        }
        this.audio?.play()
    }
    pause() {
        this.audio?.pause()
    }
    isPaused() {
        return this.audio?.paused ?? true
    }
    setCurrentTime(val) {
        if (this.audio)
            this.audio.currentTime = val
    }
}

function magicEl() {
    const soundI = Math.floor(Math.random() * chunksInfo.totalItemsCount)
    const itemI = soundI % chunksInfo.chunkSize
    const chunkI = Math.floor(soundI / chunksInfo.chunkSize)
    const soundPath = `${chunkI}/${itemI}`
    const urlPath = `https://raw.githubusercontent.com/Forprix/Meme-Sounds/main/${soundPath}`
    const tempEl = document.createElement('div')
    tempEl.innerHTML = `
        <div class=sound>
            <div><div><div>MEME</div></div><div><div></div></div><div></div></div>
            <div><div></div></div>
            <div></div>
        </div>
    `.trim()
    const soundEl = tempEl.firstChild
    const titleEl = soundEl.children[1].children[0]
    const imageEl = soundEl.children[0].children[0]
    const memeTextEl = imageEl.children[0]
    const playButtonEl = soundEl.children[0].children[1].children[0]
    const downloadButtonEl = soundEl.children[0].children[2]

    soundEl.setAttribute('data-sndidx', soundI)

    ;(async () => {
        if (!soundCache.get(soundI))
            soundCache.set(soundI, new Promise(async res => {
                const snd = {
                    config: null,
                    audio: null,
                    image: null
                }
                snd.config = await (await fetch(`${urlPath}/meme.json`)).json()
                snd.audio = new LazyAudio(`${urlPath}/${snd.config.audio}`)
                snd.audio.onEnded(() => {
                    const els = soundListEl.querySelectorAll(`[data-sndidx="${soundI}"]`)
                    els.forEach(el => el.classList.remove('playing'))
                })
                snd.image = new Image()
                snd.image.onload = () => {
                    const els = soundListEl.querySelectorAll(`[data-sndidx="${soundI}"]`)
                    els.forEach(el => {
                        const imageEl = el.children[0].children[0]
                        const memeTextEl = imageEl.children[0]
                        memeTextEl.innerText = ''
                        imageEl.style = `background: url("${soundIt.image.src}") center center no-repeat`
                        if (!el.classList.contains('loaded'))
                            el.classList.add('loaded')
                    })
                }
                snd.image.src = `${urlPath}/${snd.config.image}`
                soundCache.set(soundI, snd)
                res()
            }))

        let soundIt = soundCache.get(soundI)
        if (soundIt instanceof Promise)
            await soundIt
        
        soundIt = soundCache.get(soundI)

        if (!soundIt.audio.isPaused())
            soundEl.classList.add('playing')
        
        titleEl.innerText = soundIt.config.name

        if (soundIt.image.complete) {
            memeTextEl.innerText = ''
            imageEl.style = `background: url("${soundIt.image.src}") center center no-repeat`
            setTimeout(() => soundEl.classList.add('loaded'), 0)
            
        }
        playButtonEl.addEventListener('mousedown', () => moved = false)
        playButtonEl.addEventListener('click', () => {
            if (moved) return
            const playing = !soundIt.audio.isPaused()
            const els = soundListEl.querySelectorAll(`[data-sndidx="${soundI}"]`)
            if (playing) {
                els.forEach(el => el.classList.remove('playing'))
                soundIt.audio.pause()
            }
            else {
                els.forEach(el => el.classList.add('playing'))
                soundIt.audio.setCurrentTime(0)
                soundIt.audio.play()
            }
        })
        downloadButtonEl.addEventListener('mousedown', () => moved = false)
        downloadButtonEl.addEventListener('click', () => {
            if (moved) return
            $download(`${urlPath}/${soundIt.config.audio}`, soundIt.config.name)
        })

        // TODO: При остановке Audio убирать .playing
        // TODO: Не грузить сразу Audio
        //console.log(soundIt.audio)
        //console.log(soundIt.image.complete)
        // set url and audio



    })()


    return tempEl.firstChild
}
async function unmagicEl(el) {
    const soundI = Number(el.getAttribute('data-sndidx'))
    let soundIt = soundCache.get(soundI)
    if (soundIt instanceof Promise) {
        await soundIt
        soundIt = soundCache.get(soundI)
    }
    if (!soundIt) return
    if (!soundIt.audio.isPaused()) {
        const els = soundListEl.querySelectorAll(`[data-sndidx="${soundI}"]`)
        els.forEach(el => el.classList.remove('playing'))
        soundIt.audio.pause()
    }
    
}
function magic(rectDelta) {
    if (rectDelta.bottom > 0)
        for (let y = 0; y < rectDelta.bottom; ++y) {
            const rowEl = document.createElement('div')
            rowEl.classList.add('sound-list-row')
            for (let x = 0; x < sizeX; ++x)
                rowEl.appendChild(magicEl())
            soundListEl.appendChild(rowEl)
        }
    else if (rectDelta.bottom < 0)
        for (let y = 0; y < -rectDelta.bottom; ++y) {
            for (const el of soundListEl.lastChild.children)
                unmagicEl(el)
            soundListEl.lastChild.remove()
        }
    
    if (rectDelta.top > 0)
        for (let y = 0; y < rectDelta.top; ++y) {
            const rowEl = document.createElement('div')
            rowEl.classList.add('sound-list-row')
            for (let y = 0; y < sizeX; ++y)
                rowEl.appendChild(magicEl())
            soundListEl.insertBefore(rowEl, soundListEl.firstChild)
            offsetY -= 200
        }
    else if (rectDelta.top < 0) {
        for (let y = 0; y < -rectDelta.top; ++y) {
            for (const el of soundListEl.firstChild.children)
                unmagicEl(el)
            soundListEl.firstChild.remove()
            offsetY += 200
        }
    }

    if (rectDelta.right > 0)
        for (let x = 0; x < rectDelta.right; ++x)
            document.querySelectorAll('.sound-list-row').forEach(x => x.appendChild(magicEl()))
    else if (rectDelta.right < 0)
        for (let x = 0; x < -rectDelta.right; ++x)
            document.querySelectorAll('.sound-list-row').forEach(x => {
                unmagicEl(x.lastChild)
                x.lastChild.remove()
            })


    if (rectDelta.left > 0)
        for (let x = 0; x < rectDelta.left; ++x) {
            document.querySelectorAll('.sound-list-row').forEach(x => x.insertBefore(magicEl(), x.firstChild))
            offsetX -= 150
        }
    else if (rectDelta.left < 0)
        for (let x = 0; x < -rectDelta.left; ++x) {
            document.querySelectorAll('.sound-list-row').forEach(x => {
                unmagicEl(x.firstChild)
                x.firstChild.remove()
            })
            offsetX += 150
        }

    soundListEl.style.transform = `translate(${Math.round(loxX + offsetX)}px, ${Math.round(loxY + offsetY)}px)`

    sizeX += rectDelta.left + rectDelta.right
    sizeY += rectDelta.top + rectDelta.bottom
    if (sizeX < 0) sizeX = 0
    if (sizeY < 0) sizeY = 0
}


// addEventListener('keydown', (e) => {
//     if (e.code == 'KeyW')
//         magic({ left: 0, top: 1, right: 0, bottom: 0 })
//     if (e.code == 'KeyA')
//         magic({ left: 1, top: 0, right: 0, bottom: 0 })
//     if (e.code == 'KeyS')
//         magic({ left: 0, top: 0, right: 0, bottom: 1 })
//     if (e.code == 'KeyD')
//         magic({ left: 0, top: 0, right: 1, bottom: 0 })
//     if (e.code == 'ArrowUp')
//         magic({ left: 0, top: -1, right: 0, bottom: 0 })
//     if (e.code == 'ArrowLeft')
//         magic({ left: -1, top: 0, right: 0, bottom: 0 })
//     if (e.code == 'ArrowDown')
//         magic({ left: 0, top: 0, right: 0, bottom: -1 })
//     if (e.code == 'ArrowRight')
//         magic({ left: 0, top: 0, right: -1, bottom: 0 })
// })

new ResizeObserver(magicIfNeeded).observe(bodyEl)







})()