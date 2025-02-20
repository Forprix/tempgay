import anim, { Polygon } from './anim.js'

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// Auto-resize for canvas
{
    new ResizeObserver(() => {
        const rect = document.body.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
    }).observe(document.body)
}

// Util
{
    Math.signedRandom = function () {
        return Math.random() * 2 - 1
    }
    Math.randomInRange = function(a, b) {
        return a + (b - a) * Math.random()
    }
}

/**
 * @type {{
 *  pos1?: [number, number],
 *  pos2?: [number, number],
 *  pos?: [number, number],
 *  color: string,
 *  alpha: number,
 *  dead: boolean,
 *  size?: number, // Circle
 *  width?: number,
 *  update?: (dt: number) => void
 * }[]}
*/
let objects = []
let t0 = performance.now() / 1000
function frame() {
    let t1 = performance.now() / 1000
    const dt = t1 - t0
    t0 = t1

    // Update
    for (const object of objects)
        object?.update?.(dt)
    objects = objects.filter(x => x.dead !== true).sort((a, b) => a.zIndex > b.zIndex ? 0 : -1)

    // Physics
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const o of objects) {
        if (o.type == 'circle') {
            ctx.globalAlpha = o.alpha
            ctx.fillStyle = o.color
            ctx.beginPath()
            ctx.arc((o.pos[0] + 1) * canvas.width / 2, (o.pos[1] + 1) * canvas.height / 2, o.size, 0, Math.PI * 2)
            ctx.fill()
        }
        else if (o.type == 'line') {
            ctx.globalAlpha = o.alpha
            ctx.lineWidth = o.width
            ctx.strokeStyle = o.color
            ctx.beginPath()
            ctx.moveTo((o.pos1[0] + 1) * canvas.width / 2, (o.pos1[1] + 1) * canvas.height / 2)
            ctx.lineTo((o.pos2[0] + 1) * canvas.width / 2, (o.pos2[1] + 1) * canvas.height / 2)
            ctx.stroke()
        }
        else if (o.type == 'polygon') {
            ctx.globalAlpha = o.alpha
            ctx.fillStyle = o.color
            ctx.beginPath()
            let func = ctx.moveTo.bind(ctx)
            for (let v of o.vertices) {
                func((v[0] + 1) * canvas.width / 2, (v[1] + 1) * canvas.height / 2)
                func = ctx.lineTo.bind(ctx)
            }
            ctx.closePath()
            ctx.fill()
        }
    }

    ctx.globalAlpha = 1

    requestAnimationFrame(frame)
}
frame()


/**
 * @param {number} ms 
 * @returns {Promise<void>}
*/
const sleep = ms => new Promise(res => setTimeout(res, ms * 1000))


function spawn(object) {
    objects.push(object)
    return object
}

async function animate() {
    const triangleVertices = [
        [-0.75, 0.75],
        [0.75, 0.75],
        [0, -0.75]
    ]
    const triangleVertexObjects = []
    for (const triangleVertex of triangleVertices) {
        triangleVertexObjects.push(spawn(new anim.Circle([{
            pos: triangleVertex,
            size: 20,
            alpha: 0,
            color: '#58F',
            duration: 0.5,
            transition: 'ease',
            zIndex: 0
        }, {
            size: 8,
            alpha: 1
        }])))
        await sleep(0.2)
    }
    await sleep(0.6)
    for (let i = 0; i < triangleVertices.length; ++i) {
        const i1 = i
        const i2 = (i + 1) % triangleVertices.length
        spawn(new anim.Line([{
            pos1: triangleVertices[i1],
            pos2: triangleVertices[i1],
            width: 4,
            alpha: 0.5,
            color: 'white',
            duration: 0.2,
            transition: 'ease',
            zIndex: -1
        }, {
            pos2: triangleVertices[i2],
            duration: 0.7,
        }, {
            alpha: 0,
            duration: 0,
        }]))
        await sleep(0.2)
    }
    await sleep(0.6)
    let chosenDot
    {
        const dots = []
        for (let i = 0; i < 10; ++i) {
            for (let l = 0; l < 40; ++l) {
                dots.push(spawn({
                    pos: [Math.signedRandom() * 0.9, Math.signedRandom() * 0.9],
                    type: 'circle',
                    color: 'white',
                    alpha: 0.5,
                    dead: false,
                    size: 0,
                    zIndex: -2,
                    t: 0,
                    wipeOut: false,
                    vel: [0, 0],
                    fadeOut: false,
                    update(dt) {
                        this.t += dt
                        this.size = Math.min(this.t / 0.5, 1) * 4
                        this.pos[0] += (this.vel[0]) * dt
                        this.pos[1] += (this.vel[1]) * dt
                        if (this.fadeOut) {
                            this.alpha -= 0.5 * dt
                            if (this.alpha <= 0)
                                this.dead = true
                        }
                    }
                }))
            }
            await sleep(0.1)
        }
        await sleep(0.5)
        chosenDot = dots[Math.floor(Math.random() * dots.length)]
        for (const dot of dots) {
            if (dot == chosenDot) continue
            dot.fadeOut = true
        }
        chosenDot.dead = true
        chosenDot = spawn(new anim.Circle([{
            ...chosenDot,
            zIndex: 2,
            alpha: 0,
            size: 100,
            color: '#0F8',
            duration: 2,
            transition: 'ease-in-out',
        }, {
            size: 4,
            alpha: 1,
            color: '#3F9',
        }]))
    }
    await sleep(2.0)

    function classicSerpinski(vertices, depth = 0) {
        if (depth >= 6) return
        spawn(new Polygon([{
            vertices: [...vertices],
            color: '#3F9',
            alpha: 0,
            zIndex: -5,
            duration: 0.5,
            transition: 'ease'
        }, {
            alpha: 1,
        }]))
        spawn(new Polygon({
            vertices: [
                [(vertices[0][0] + vertices[1][0]) / 2, (vertices[0][1] + vertices[1][1]) / 2],
                [(vertices[1][0] + vertices[2][0]) / 2, (vertices[1][1] + vertices[2][1]) / 2],
                [(vertices[2][0] + vertices[0][0]) / 2, (vertices[2][1] + vertices[0][1]) / 2],
            ],
            color: '#111',
            alpha: 1,
            zIndex: -4
        }))
        classicSerpinski([
            [vertices[0][0], vertices[0][1]],
            [(vertices[0][0] + vertices[1][0]) / 2, (vertices[0][1] + vertices[1][1]) / 2],
            [(vertices[2][0] + vertices[0][0]) / 2, (vertices[2][1] + vertices[0][1]) / 2],
        ], depth + 1)
        classicSerpinski([
            [vertices[1][0], vertices[1][1]],
            [(vertices[0][0] + vertices[1][0]) / 2, (vertices[0][1] + vertices[1][1]) / 2],
            [(vertices[1][0] + vertices[2][0]) / 2, (vertices[1][1] + vertices[2][1]) / 2],
        ], depth + 1)
        classicSerpinski([
            [vertices[2][0], vertices[2][1]],
            [(vertices[1][0] + vertices[2][0]) / 2, (vertices[1][1] + vertices[2][1]) / 2],
            [(vertices[2][0] + vertices[0][0]) / 2, (vertices[2][1] + vertices[0][1]) / 2],
        ], depth + 1)
    }

    let chosenDots = []
    for (let i = 1; i < 1000; ++i) {
        chosenDots.push(chosenDot)
        await gay(i * 2)
    }
    await sleep(0.5)
    for (const dot of chosenDots) {
        dot.dead = true
    }
    await sleep(1.0)
    classicSerpinski(triangleVertices)
    
    async function gay(speed) {
        const i = Math.floor(Math.random() * 3)

        const old = triangleVertexObjects[i]
        old.dead = true
        triangleVertexObjects[i] = spawn(new anim.Circle([{
            pos: triangleVertexObjects[i].pos,
            color: triangleVertexObjects[i].color,
            alpha: triangleVertexObjects[i].alpha,
            size: triangleVertexObjects[i].size,
            zIndex: triangleVertexObjects[i].zIndex,
            duration: 0.6,
            size: 32,
            color: 'white',
            transition: 'ease'
        }, {
            color: '#58F',
            size: 8,
        }]))
        await sleep(Math.max(1.8 / speed, 0))
    
        let line = spawn(new anim.Line([{
            pos1: chosenDot.pos,
            pos2: triangleVertexObjects[i].pos,
            width: 4,
            alpha: 0,
            color: 'white',
            transition: 'ease',
            duration: 0.6,
        },
        {
            alpha: 0.5,
        }]))
        await sleep(Math.max(2.0 / speed, 0))
    
        let newDot = spawn(new anim.Circle([{
            pos: chosenDot.pos,
            color: chosenDot.color,
            alpha: chosenDot.alpha,
            size: 4,
            zIndex: chosenDot.zIndex,
            alpha: 0,
            transition: 'ease',
            duration: 0.3,
            pos: [
                (chosenDot.pos[0] + old.pos[0]) / 2,
                (chosenDot.pos[1] + old.pos[1]) / 2,
            ]
        }, {
            alpha: 1
        }]))
    
        await sleep(Math.max(1.0 / speed, 0))
        line.dead = true
        line = spawn(new anim.Line([{
            pos1: line.pos1,
            pos2: line.pos2,
            color: line.color,
            alpha: line.alpha,
            width: line.width,
            zIndex: line.zIndex,
            duration: Math.max(1.0 / speed, 0.01),
            transition: 'ease'
        }, {
            alpha: 0,
            duration: 0
        }]))

        chosenDot = newDot
    }

   
}
animate()

console.log(canvas)