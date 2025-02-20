/** @type {HTMLCanvasElement} */
const canvas1 = document.querySelector('#canvas1')
const canvas2 = document.querySelector('#canvas2')
const sleep = s => new Promise(res => setTimeout(res, s * 1000))
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]

const audio = new Audio('game_shit_pidor.mp3')
audio.loop = true

let lost = false
let dashing = false

const normalizeUrl = (() => {
    const a = document.createElement('a')
    return url => (a.href = url, a.href)
})()

function lerp(a, b, t) {
    return a + (b - a) * t
}

const AsyncMap = function() {
    const map = new Map
    const r = {
        get: async k => await map.get(k),
        set: (k, v) => (r.update(k, v), r),
        update: (k, v) => {
            map.set(k, v)
            if (v instanceof Promise) v.then(x => map.set(k, x))
            return v
        }
    }
    return r
}

let audioContext
const [playSound, preloadSounds] = (() => {
    const sounds = new AsyncMap
    return [
        async (url, options) => {
            if (audioContext == null) return
            url = normalizeUrl(url)
            let value = await sounds.get(url)
            if (value instanceof ArrayBuffer)
                value = await sounds.update(url, audioContext.decodeAudioData(value))
            const source = audioContext.createBufferSource()
            source.buffer = value
            source.playbackRate.value = options.pitch ?? 1
            const gain = audioContext.createGain()
            gain.gain.value = options.volume ?? 1
            source.connect(gain)
            gain.connect(audioContext.destination)
            source.start()
        },
        urls => Promise.all(urls.map(normalizeUrl).map(x => sounds.set(x, fetch(x).then(x => x.arrayBuffer()))))
    ]
})()
preloadSounds(['beep1.wav', 'beep2.wav', 'beep3.wav', 'beep4.wav', 'beep5.wav', 'beep6.wav'])

function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image()
        img.onload = () => res(img)
        img.src = src
    })
}

const assets = new Map
async function loadAsset(path) {
    let val = assets.get(path)
    if (val != null) return val
    switch (path.match(/\.[^\.]+$/)?.[0].toLowerCase()) {
        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.webp':
        case '.gif':
            val = await loadImage(path)
            assets.set(path, val)
            return val
    }
}

let particles = []
async function spawnParticle(particle) {
    const v = {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        filter: '',
        scale: { x: 1, y: 1 },
        slowdown: { x: 0, y: 0 },
        maxVelocity: { x: Infinity, y: Infinity },
        rotation: 0,
        timeToLive: 1,
        timeToDisappear: 0,
        disappearAction: 'fade',
        lifetime: 0,
        ...particle
    }
    if (v.type == 'image')
        if (typeof v.image == 'string')
            v.image = await loadAsset(v.image)
    particles.push(v)
    return v
}

const vec2 = (x, y) => ({x, y})

const randomFigureCenters = [
    [ { x: 2.5, y: 2.5 }, { x: 2.0, y: 2.0 } ],
    [ { x: 1.0, y: 1.0 } ],
    [ { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 } ],
    [ { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 } ],
    [ { x: 2.0, y: 2.0 }, { x: 1.5, y: 1.5 } ],
    [ { x: 2.0, y: 2.0 }, { x: 1.5, y: 1.5 } ],
    [ { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 1.5 } ]
]
const randomFigureShapes = [
    [
        [
            vec2(0, 2),
            vec2(1, 2),
            vec2(2, 2),
            vec2(3, 2),
        ],
        [
            vec2(2, 0),
            vec2(2, 1),
            vec2(2, 2),
            vec2(2, 3),
        ]
    ], // Line
    [
        [
            vec2(0, 0),
            vec2(1, 0),
            vec2(0, 1),
            vec2(1, 1),
        ]
    ], // Square
    [
        [
            vec2(0, 1),
            vec2(1, 1),
            vec2(2, 1),
            vec2(2, 2),
        ],
        [
            vec2(1, 0),
            vec2(1, 1),
            vec2(1, 2),
            vec2(0, 2),
        ],
        [
            vec2(0, 0),
            vec2(0, 1),
            vec2(1, 1),
            vec2(2, 1),
        ],
        [
            vec2(1, 0),
            vec2(2, 0),
            vec2(1, 1),
            vec2(1, 2),
        ],
    ], // L-Shape 1
    [
        [
            vec2(0, 2),
            vec2(0, 1),
            vec2(1, 1),
            vec2(2, 1),
        ],
        [
            vec2(0, 0),
            vec2(1, 0),
            vec2(1, 1),
            vec2(1, 2),
        ],
        [
            vec2(2, 0),
            vec2(0, 1),
            vec2(1, 1),
            vec2(2, 1),
        ],
        [
            vec2(1, 0),
            vec2(1, 1),
            vec2(1, 2),
            vec2(2, 2),
        ],
    ], // L-Shape 2
    [
        [
            vec2(0, 2),
            vec2(1, 2),
            vec2(1, 1),
            vec2(2, 1),
        ],
        [
            vec2(1, 0),
            vec2(1, 1),
            vec2(2, 1),
            vec2(2, 2),
        ],
    ], // Z-Shape 1: correct rotation
    [
        [
            vec2(0, 1),
            vec2(1, 1),
            vec2(1, 2),
            vec2(2, 2),
        ],
        [
            vec2(1, 2),
            vec2(1, 1),
            vec2(2, 1),
            vec2(2, 0),
        ],
    ], // Z-Shape 2
    [
        [
            vec2(0, 1),
            vec2(1, 1),
            vec2(1, 2),
            vec2(2, 1),
        ],
        [
            vec2(1, 0),
            vec2(1, 1),
            vec2(0, 1),
            vec2(1, 2),
        ],
        [
            vec2(0, 1),
            vec2(1, 1),
            vec2(1, 0),
            vec2(2, 1),
        ],
        [
            vec2(1, 0),
            vec2(1, 1),
            vec2(2, 1),
            vec2(1, 2),
        ]
    ], // Penis-Shape
]

let biggestShapeWidth, biggestShapeHeight
for (const shape of randomFigureShapes) {
    let minX, maxX
    let minY, maxY
    for (const block of shape[0]) {
        const {x, y} = block
        if (maxX == null || x > maxX) maxX = x
        if (minX == null || x < minX) minX = x
        if (maxY == null || y > maxY) maxY = y
        if (minY == null || y < minY) minY = y
    }
    const width = maxX - minX + 1
    const height = maxY - minY + 1
    if (biggestShapeWidth == null || width > biggestShapeWidth) biggestShapeWidth = width
    if (biggestShapeHeight == null || height > biggestShapeHeight) biggestShapeHeight = height
}


const randomFigureColors = [
    [255, 0,   0  ],
    [0,   255, 0  ],
    [0,   0,   255],
    [255, 255, 0  ],
    [0,   255, 255],
    [255, 0,   255],
].map(x => rgb2hsv(x))

function rgb2css(rgb) {
    if (rgb == null) return '#0000'
    return '#' + rgb.map(x => Math.floor(x).toString(16).padStart(2, '0')).join('')
}
function rgb2hsv(rgb) {
    const [r, g, b] = rgb
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn
    rabs = r / 255
    gabs = g / 255
    babs = b / 255
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs)
    diffc = c => (v - c) / 6 / diff + 1 / 2
    percentRoundFn = num => Math.round(num * 100) / 100
    if (diff == 0)
        h = s = 0
    else
        s = diff / v
        rr = diffc(rabs)
        gg = diffc(gabs)
        bb = diffc(babs)

        if (rabs == v)
            h = bb - gg
        else if (gabs == v)
            h = (1 / 3) + rr - bb
        else if (babs == v)
            h = (2 / 3) + gg - rr
        if (h < 0) 
            h += 1
        else if (h > 1)
            h -= 1
    return [Math.round(h * 360),  percentRoundFn(s * 100), percentRoundFn(v * 100)]
}
function hsv2rgb([H, S, V]) {
    S /= 100
    V /= 100
    function mix(a, b, v) {
        return (1-v)*a + v*b
    }                            
    var V2 = V * (1 - S);
    var r  = ((H>=0 && H<=60) || (H>=300 && H<=360)) ? V : ((H>=120 && H<=240) ? V2 : ((H>=60 && H<=120) ? mix(V,V2,(H-60)/60) : ((H>=240 && H<=300) ? mix(V2,V,(H-240)/60) : 0)));
    var g  = (H>=60 && H<=180) ? V : ((H>=240 && H<=360) ? V2 : ((H>=0 && H<=60) ? mix(V2,V,H/60) : ((H>=180 && H<=240) ? mix(V,V2,(H-180)/60) : 0)));
    var b  = (H>=0 && H<=120) ? V2 : ((H>=180 && H<=300) ? V : ((H>=120 && H<=180) ? mix(V2,V,(H-120)/60) : ((H>=300 && H<=360) ? mix(V,V2,(H-300)/60) : 0)));
    return [
        r * 255,
        g * 255,
        b * 255
    ]
}   


// Звук бума повышается в зависимости от высоты башенки

const frameRate = 2

let currentGameRate = frameRate
const blockSize = 30
const blockSubSize = blockSize / 5
const worldWidth = 10
const worldHeight = 20
const world = Array(worldWidth * worldHeight).fill(null)
let currentFigure = null


let nextFigureColorIndex
let nextFigureShapeIndex
let figurePreviewOffset

function genNextFigure() {
    nextFigureColorIndex = ~~(randomFigureColors.length * Math.random())
    nextFigureShapeIndex = ~~(randomFigureShapes.length * Math.random())
    let minX, minY
    for (const block of randomFigureShapes[nextFigureShapeIndex][0]) {
        if (minX == null || block.x < minX) minX = block.x
        if (minY == null || block.y < minY) minY = block.y
    }
    figurePreviewOffset = { x: -minX, y: -minY }
}

// TODO: dt lerp
// TODO: prevent key repeat

let currentFigurePos = null
let currentFigureRotation = null
let currentFigureRotation2 = 0
let impactCounter = 0
let impactCounter2 = 0
let impactCounter2_d 
let impactCounter3 = 0
let outlineMode = 0
let raisingt = 0
let raisingt_speed = 1


function rotate(x, y, cx, cy, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy
    return [nx, ny]
}

const [seed, random] = (() => {
    var m_w = 123456789
    var m_z = 987654321
    var mask = 0xffffffff
    
    return [
        (i) => {
            m_w = (123456789 + i) & mask
            m_z = (987654321 - i) & mask
        }, 
        () => {
            m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask
            m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask
            var result = ((m_z << 16) + (m_w & 65535)) >>> 0
            result /= 4294967296
            return result
        }
    ]
})()


requestAnimationFrame = cb => setTimeout(cb, 1000 / 160)



let tOld = performance.now() / 1000
let tOld2 = performance.now() / 1000
;(async () => {
    let img_p = loadImage('vignette.png')

    const ctx = canvas1.getContext('2d')
    const ctx2 = canvas2.getContext('2d')

    // Задний фон ускоряется до бесконечности
    // Очень медленно убирается свечение
    // Поворачивается очень медленно

    // let cntr = 0
    function startRendering(cb) {
        const cb_ = () => {
            // const tNew2 = performance.now() / 1000
            // const dt = tNew2 - tOld2
            // tOld2 = tNew2
            // cntr += dt
            // if (cntr > (1 / 200)) {
            //     cntr = cntr % (1 / 200)
            //     cb()
            // }
            // setTimeout(cb_, ((1 / 200) - cntr) * 1000)
            cb()
            requestAnimationFrame(cb_)
        }
        // cb_()
        cb_()
    }
    
    function render() {
        let tNew = performance.now() / 1000
        const dt = tNew - tOld
        raisingt += raisingt_speed * dt
        ctx.globalAlpha = 1
        ctx.fillStyle = '#2a2d30'
        ctx.fillRect(0, 0, canvas1.width, canvas1.height)
        const n1 = [50, 92]
        const n2 = [40, 100]
        const n3 = [60, 85]
        const n4 = [60, 85]
        const n5 = [60, 75]
        function drawFlatColor(ctx, x, y, hsv, scale, rotation) {
            ctx.fillStyle = rgb2css(hsv2rgb(hsv))
            ctx.beginPath()
            ctx.moveTo(...rotate(x - blockSize / 2 * scale, y - blockSize / 2 * scale, x, y, rotation))
            ctx.lineTo(...rotate(x + blockSize / 2 * scale, y - blockSize / 2 * scale, x, y, rotation))
            ctx.lineTo(...rotate(x + blockSize / 2 * scale, y + blockSize / 2 * scale, x, y, rotation))
            ctx.lineTo(...rotate(x - blockSize / 2 * scale, y + blockSize / 2 * scale, x, y, rotation))
            ctx.closePath()
            ctx.fill()
        }
        function drawBlock(ctx, x, y, color, rotation) {
            const [x_, y_] = [x - blockSize / 2, y - blockSize / 2]
            // const center = {
            //     x: x_ + blockSize / 2,
            //     y: y_ + blockSize / 2,
            // }

            const hsv1 = [...color]
            const hsv = [...hsv1]
            hsv[1] = hsv1[1] * (n1[0] / 100)
            hsv[2] = hsv1[2] * (n1[1] / 100)
            ctx.fillStyle = rgb2css(hsv2rgb(hsv))
            ctx.beginPath()
            ctx.moveTo(...rotate(x_, y_, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize, y_, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize, y_ + blockSize, x, y, rotation))
            ctx.lineTo(...rotate(x_, y_ + blockSize, x, y, rotation))
            ctx.closePath()
            ctx.fill()

            hsv[1] = hsv1[1] * (n2[0] / 100)
            hsv[2] = hsv1[2] * (n2[1] / 100)
            ctx.fillStyle = rgb2css(hsv2rgb(hsv))
            ctx.beginPath()
            ctx.moveTo(...rotate(x_, y_, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSubSize, y_ + blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize - blockSubSize, y_ + blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize, y_, x, y, rotation))
            ctx.closePath()
            ctx.fill()

            hsv[1] = hsv1[1] * (n3[0] / 100)
            hsv[2] = hsv1[2] * (n3[1] / 100)
            ctx.fillStyle = rgb2css(hsv2rgb(hsv))
            ctx.beginPath()
            ctx.moveTo(...rotate(x_, y_, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSubSize, y_ + blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSubSize, y_ + blockSize - blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_, y_ + blockSize, x, y, rotation))
            ctx.closePath()
            ctx.fill()

            
            hsv[1] = hsv1[1] * (n4[0] / 100)
            hsv[2] = hsv1[2] * (n4[1] / 100)
            ctx.fillStyle = rgb2css(hsv2rgb(hsv))
            ctx.beginPath()
            ctx.moveTo(...rotate(x_ + blockSize, y_, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize - blockSubSize, y_ + blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize - blockSubSize, y_ + blockSize - blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize, y_ + blockSize, x, y, rotation))
            ctx.closePath()
            ctx.fill()

            hsv[1] = hsv1[1] * (n5[0] / 100)
            hsv[2] = hsv1[2] * (n5[1] / 100)
            ctx.fillStyle = rgb2css(hsv2rgb(hsv))
            ctx.beginPath()
            ctx.moveTo(...rotate(x_,      y_ + blockSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSubSize,              y_ + blockSize - blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize - blockSubSize,  y_ + blockSize - blockSubSize, x, y, rotation))
            ctx.lineTo(...rotate(x_ + blockSize,      y_ + blockSize, x, y, rotation))
            ctx.closePath()
            ctx.fill()
        }
        function drawShape(ctx, shape, offset, color, center, rotation) {
            for (const block of shape) {
                let [x, y] = [(block.x + 0.5) * blockSize, (block.y + 0.5) * blockSize]
                ;[x, y] = rotate(x, y, center.x * blockSize, center.y * blockSize, rotation)
                drawBlock(ctx, x + offset.x * blockSize, y + offset.y * blockSize, color, rotation)
            }
        }
        const t0 = performance.now()
        const d = 10
        const td = Math.floor(t0 * d) / d
        seed(td)
        const shakedx = (Math.floor(impactCounter * d) / d) * (random() * 2 - 1) * 15
        const shakedy = (Math.floor(impactCounter * d) / d) * (random() * 2 - 1) * 15
        
        impactCounter = lerp(impactCounter, 0, 1 - 0.00025 ** dt)
        impactCounter2 = lerp(impactCounter2, 1, 1 - impactCounter2_d ** dt)
        impactCounter3 = lerp(impactCounter3, 1, 1 - 0.001 ** dt)
        raisingt_speed = lerp(raisingt_speed, 1, 1 - 0.05 ** dt)

        for (let y_ = -1; y_ < worldHeight; ++y_)
            for (let x_ = 0; x_ < worldWidth; ++x_) {
                let x = (x_ + 0.5) * blockSize
                let y = (y_ + 0.5) * blockSize
                const yoffset = (raisingt * blockSize) % blockSize
                drawBlock(ctx, x, y + yoffset, [210, 12, 14], 0)
            }
        ctx.drawImage(img_p, 0, 0, canvas1.width, canvas1.height)
        for (let y_ = 0; y_ < worldHeight; ++y_)
            for (let x_ = 0; x_ < worldWidth; ++x_) {
                const v = world[y_ * worldWidth + x_]
                if (v == null) continue
                let x = (x_ + 0.5) * blockSize + shakedx
                let y = (y_ + 0.5) * blockSize + shakedy
                const hsv = [0, 80, 100]
                if (outlineMode == 0)
                    hsv[0] = world[y_ * worldWidth + x_][0]
                else
                    hsv[0] = ((performance.now() / 1000 * 180) % 360)
                drawFlatColor(ctx, x, y, hsv, impactCounter2, 0)
            }
        for (let y_ = 0; y_ < worldHeight; ++y_)
            for (let x_ = 0; x_ < worldWidth; ++x_) {
                const v = world[y_ * worldWidth + x_]
                if (v == null) continue
                let x = (x_ + 0.5) * blockSize + shakedx
                let y = (y_ + 0.5) * blockSize + shakedy
                const hsv = [...v]
                hsv[1] *= impactCounter3
                drawBlock(ctx, x, y, hsv, 0)
            }
        if (currentFigure != null) {
            currentFigurePos = {
                x: lerp(currentFigurePos.x, currentFigure.shape[0].x - randomFigureShapes[currentFigure.shapeIndex][currentFigure.rotation][0].x, 1 - 0.0000000000001 ** dt),
                y: lerp(currentFigurePos.y, currentFigure.shape[0].y - randomFigureShapes[currentFigure.shapeIndex][currentFigure.rotation][0].y, 1 - 0.0000000000001 ** dt)
            }
            currentFigureRotation = lerp(currentFigureRotation, 0, 1 - 0.000000000000001 ** dt)
            currentFigureRotation2 = lerp(currentFigureRotation2, 0, 1 - 0.0000000001 ** dt)
            const rot = currentFigureRotation * 90 + currentFigureRotation2
            const blocks = randomFigureShapes[currentFigure.shapeIndex][currentFigure.rotation]
            drawShape(
                ctx,
                blocks,
                currentFigurePos,
                currentFigure.color,
                randomFigureCenters[currentFigure.shapeIndex][(currentFigure.rotation + 1) % randomFigureCenters[currentFigure.shapeIndex].length],
                rot
            )
        }
        ctx2.fillStyle = '#131313'
        ctx2.fillRect(0, 0, canvas2.width, canvas2.height)
        if (nextFigureShapeIndex != null) {
            const shape = randomFigureShapes[nextFigureShapeIndex][0]
            drawShape(
                ctx2,
                shape,
                figurePreviewOffset,
                randomFigureColors[nextFigureColorIndex],
                randomFigureCenters[nextFigureShapeIndex][0],
                0
            )
        }
        ctx.fillStyle = 'white'
        for (const p of particles) {
            p.position.x += p.velocity.x * dt
            p.position.y += p.velocity.y * dt
            p.velocity.x += p.acceleration.x * dt
            p.velocity.y += p.acceleration.y * dt
            p.velocity.x /= Math.max(1, p.slowdown.x ** (1 / dt))
            p.velocity.y /= Math.max(1, p.slowdown.y ** (1 / dt))
            p.velocity.x = Math.min(p.velocity.x, p.maxVelocity.x)
            p.velocity.y = Math.min(p.velocity.y, p.maxVelocity.y)
            p.lifetime += dt
            ctx.globalAlpha = 1
            if (p.lifetime > p.timeToLive) {
                if (p.disappearAction && p.timeToDisappear > 0) {
                    const progress = (p.lifetime - p.timeToLive) / p.timeToDisappear
                    ctx.globalAlpha = Math.max(0, 1 - progress)
                }
            }
            switch (p.type) {
                case 'image':
                    ctx.save()
                    const fb = ctx.filter
                    ctx.resetTransform()
                    ctx.filter = p.filter
                    ctx.translate(p.position.x, p.position.y)
                    ctx.scale(p.scale.x ?? 1, p.scale.y ?? 1)
                    ctx.rotate((p.rotation / Math.PI * 180) ?? 0)
                    ctx.translate(-p.image.width / 2, -p.image.height / 2)
                    ctx.drawImage(p.image, 0, 0, p.image.width, p.image.height)
                    ctx.restore()
                    ctx.filter = fb
                    break
                case 'circle':
                    ctx.beginPath()
                    ctx.arc(p.position.x, p.position.y, 10, 0, 2 * Math.PI)
                    ctx.fill()
                    break
            }
        }
        particles = particles.filter(x => x.lifetime < (x.timeToLive + x.timeToDisappear))
        tOld = tNew
    }


    const keys = new Set()

    addEventListener('mousedown', async e => {
        const rect = canvas1.getBoundingClientRect()
        if (rect.width == 0 || rect.height == 0) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
    })
    addEventListener('keydown', e => {
        if (e.repeat) return
        keys.add(e.code)
        if (e.code == 'KeyS' || e.code == 'ArrowDown') {
            dashing = true
            playSound('beep6.wav', { pitch: Math.random() * 0.3 + 0.8 })
            return
        }
        if (currentFigure == null) return
        if (e.code == 'KeyD' || e.code == 'ArrowRight') {
            currentFigureRotation2 = -20
            playSound('beep5.wav', { pitch: Math.random() + 0.75 })
            let maxX
            for (const block of currentFigure.shape) {
                const x = block.x + 1
                const wBlock = world[block.y * worldWidth + x]
                if (wBlock != null) return
                if (maxX == null || block.x > maxX) maxX = block.x
            }
            if (maxX + 1 >= worldWidth)
                return
            for (const block of currentFigure.shape)
                block.x += 1
            return
        }
        if (e.code == 'KeyA' || e.code == 'ArrowLeft') {
            currentFigureRotation2 = 20
            playSound('beep5.wav', { pitch: Math.random() + 0.75 })
            let minX
            for (const block of currentFigure.shape) {
                const x = block.x - 1
                const wBlock = world[block.y * worldWidth + x]
                if (wBlock != null) return
                if (minX == null || block.x < minX) minX = block.x
            }
            if (minX <= 0)
                return
            for (const block of currentFigure.shape)
                block.x -= 1
            return
        }
        if (e.code == 'KeyW' || e.code == 'ArrowUp') {
            playSound('beep4.wav', { pitch: Math.random() + 0.3 })
            const rpos = {
                x: currentFigure.shape[0].x - randomFigureShapes[currentFigure.shapeIndex][currentFigure.rotation][0].x,
                y: currentFigure.shape[0].y - randomFigureShapes[currentFigure.shapeIndex][currentFigure.rotation][0].y
            }
            const rotation = (currentFigure.rotation + 1) % randomFigureShapes[currentFigure.shapeIndex].length
            const newShape = randomFigureShapes[currentFigure.shapeIndex][rotation].map(v => {
                return { x: v.x + rpos.x, y: v.y + rpos.y }
            })
            for (const block of newShape) {
                if (block.x < 0 || block.x >= worldWidth) return
                if (block.y >= worldHeight) return
                const v = world[block.y * worldWidth + block.x]
                if (v != null) return
            }
            currentFigure.rotation = rotation
            currentFigureRotation = 1
            currentFigure.shape = newShape
            return
        }
    })
    addEventListener('keyup', e => {
        if (e.repeat) return
        keys.delete(e.code)
        if (e.code == 'KeyS' || e.code == 'ArrowDown') {
            dashing = false
            return
        }
    })

    new ResizeObserver(() => {
        canvas1.width = blockSize * worldWidth
        canvas1.height = blockSize * worldHeight
        canvas2.width = blockSize * biggestShapeWidth
        canvas2.height = blockSize * biggestShapeHeight
    }).observe(document.body)


    addEventListener('mousedown', async () => {
        if (img_p instanceof Promise) img_p = await img_p
        audio.volume = 0.1
        audio.play()
        genNextFigure()
        canvas1.classList.remove('hidden')
        canvas2.classList.remove('hidden')
        document.querySelector('.welcoming-message').classList.add('hidden')
        startRendering(render)

        audioContext = new AudioContext
    
        let tOld = performance.now()
        let tAcc = 0
        while (true) {
            if (keys.has('KeyS') || keys.has('ArrowDown'))
                currentGameRate = frameRate * 10
            else
                currentGameRate = frameRate
    
            const tNew = performance.now()
            const tDelta = tNew - tOld
            tAcc += tDelta
    
            if (tAcc > ((1 / currentGameRate) * 1000)) {
                tAcc = 0
                
                if (currentFigure == null) {
                    currentFigure = {
                        shape: structuredClone(randomFigureShapes[nextFigureShapeIndex][0]),
                        color: structuredClone(randomFigureColors[nextFigureColorIndex]),
                        rotation: 0,
                        shapeIndex: nextFigureShapeIndex
                    }
                    genNextFigure()
                    // Place each block in center and above the ceiling
                    let maxY, minX, maxX
                    for (const block of currentFigure.shape) {
                        if (maxY == null || block.y > maxY) maxY = block.y
                        if (minX == null || block.x < minX) minX = block.x
                        if (maxX == null || block.x > maxX) maxX = block.x
                    }
                    const boundingWidth = maxX - minX
                    // Translate figure blocks
                    
                    for (const block of currentFigure.shape) {
                        block.x += Math.floor((worldWidth - boundingWidth) / 2)
                        block.y -= maxY
                        if (world[block.y * worldWidth + block.x] != null) {
                            if (!lost) {
                                lost = true
                                // ... lost logics
                            }
                        }
                    }
                    currentFigurePos = {
                        x: Math.floor((worldWidth - boundingWidth) / 2),
                        y: -maxY * 2
                    }
                    currentFigureRotation = 0
                }
                else {
                    let placeDown = false
                    for (const block of currentFigure.shape) {
                        const x = block.x
                        const y = block.y + 1
                        if (x < 0 || x >= worldWidth) continue
                        if (y < 0) continue
                        if (world[y * worldWidth + x] != null || y >= worldHeight) {
                            placeDown = true
                            break
                        }
                    }
                    
                    if (!placeDown) {
                        if (!dashing) playSound('beep1.wav', { pitch: Math.random() * 0.4 + 0.5, volume: 0.6 })
                        for (const block of currentFigure.shape)
                            block.y += 1
                    }
                    else {
                        impactCounter += 1
                        impactCounter3 = 0
                        playSound('beep2.wav', { pitch: Math.random() + 0.3 })
                        for (const block of currentFigure.shape) {
                            world[block.y * worldWidth + block.x] = currentFigure.color
                            for (let i = 0; i < 5; ++i) 
                                await spawnParticle({
                                    type: 'image',
                                    scale: { x: 0.8, y: 0.8 },
                                    image: `particle${~~(Math.random() * 4) + 1}.png`,
                                    filter: `hue-rotate(${currentFigure.color[0]}deg) saturate(50%) brightness(300%)`,
                                    rotation: Math.random() * 360,
                                    position: { x: (block.x + 0.5) * blockSize, y: (block.y + 0.5) * blockSize },
                                    velocity: { x: (Math.random() * 2 - 1)  * 600, y: (Math.random() * 2 - 1) * 600 },
                                    acceleration: { x: 0, y: 800 },
                                    timeToDisappear: 1,
                                    disappearAction: 'fade'
                                })
                        }
                        let lc = 0
                        for (let y = worldHeight - 1; y >= 0; --y) {
                            let lineFull = true
                            while (lineFull) {
                                for (let x = 0; x < worldWidth; ++x) {
                                    if (world[y * worldWidth + x] == null) {
                                        lineFull = false
                                        break
                                    }
                                }
                                if (lineFull) ++lc
                                for (let x = 0; x < worldWidth; ++x) {
                                    world[y * worldWidth + x] = world[(y - lc) * worldWidth + x] ?? null
                                }
                            }
                        }
                        if (lc > 0) {
                            raisingt_speed += 10
                            outlineMode = 1
                            impactCounter2_d = 0.2
                            impactCounter2 = 1.7
                            playSound('beep3.wav', { pitch: Math.random() + 0.85 })
                        }
                        else {
                            raisingt_speed += 1
                            outlineMode = 0
                            impactCounter2_d = 0.0003
                            impactCounter2 = 1.5
                        }
                        currentFigure = null
                    }
                }
            }
            tOld = tNew
            await sleep(0)
        }
    }, { once: true })
})()
