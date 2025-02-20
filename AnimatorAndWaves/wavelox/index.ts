// @ts-nocheck
import { distance, downloadTextToFile, downloadToFile, abs, floor, sin, cos, round, SQRT2, PI, ceil, lerp, loadImage, max, min, sleep, vec2nvec, sign, clamp, sqrt, random } from '../util.js'
import Vec2 from '../vec2.js'

import Game from './game.js'

const game = new Game()

const { engine } = game

const [ canvas, gl ]: [ HTMLCanvasElement, WebGL2RenderingContext ] = [engine.canvases[0], engine.ctxes[0]]

const isRGBA32FSupported = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('OES_texture_float')

if (!isRGBA32FSupported)
  console.error('Floating-point textures are not supported.')
else
  console.log('Floating-point textures are supported.')

function resize(size) {
    canvas.width = size.x
    canvas.height = size.y
    gl.viewport(0, 0, ...size)
}
engine.on('resize', resize)
resize(Vec2(innerWidth, innerHeight))

engine.on('update', dt => {
    const w = canvas.width
    const h = canvas.height
})

function createTexture() {
    const txt = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, txt)
    gl.texStorage2D(
        gl.TEXTURE_2D,
        1,
        gl.RGBA32F,
        canvas.width,
        canvas.height,
    )
    // gl.texImage2D(
    //     gl.TEXTURE_2D, 
    //     0, 
    //     gl.RGBA32F,
    //     canvas.width, 
    //     canvas.height, 
    //     0, 
    //     gl.RGBA, 
    //     gl.FLOAT,
    //     null
    // )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    return txt
}
function createProgram(vertCode, fragCode) {
    function createShader(type, code) {
        const shdr = gl.createShader(type)
        gl.shaderSource(shdr, code)
        gl.compileShader(shdr)
        if (!gl.getShaderParameter(shdr, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shdr))
        return shdr
    }
    const vertShader = createShader(gl.VERTEX_SHADER, vertCode)
    const fragShader = createShader(gl.FRAGMENT_SHADER, fragCode)
    const program = gl.createProgram()
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program))
    return program
}

// Gotta switch between them
const txt1 = createTexture()
const txt2 = createTexture()
const txt3 = createTexture()
const txt4 = createTexture()
const txt5 = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, txt5)
gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    canvas.width,
    canvas.height,
)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
const img = await loadImage('walls.png')
gl.bindTexture(gl.TEXTURE_2D, txt5)
gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, img.width, img.height, gl.RGBA, gl.UNSIGNED_BYTE, img)

const program1 = createProgram(`#version 300 es
    precision highp float;
    precision highp int;
    void main() {
        int bits = gl_VertexID % 3 + gl_VertexID / 3;
        vec2 v = vec2(bits >> 1 & 1, bits & 1);
        gl_Position = vec4(v * 2. - 1., 0, 1);
    }
`, await (await fetch('frag1.glsl')).text())
const uTexture = gl.getUniformLocation(program1, 'uTexture')
const uTextureSize = gl.getUniformLocation(program1, 'uTextureSize')
const uExposure = gl.getUniformLocation(program1, 'uExposure')

const program2 = createProgram(`#version 300 es
    precision highp float;
    precision highp int;
    out vec2 vTexCoord;
    void main() {
        int bits = gl_VertexID % 3 + gl_VertexID / 3;
        vec2 v = vec2(bits >> 1 & 1, bits & 1);
        vTexCoord = v;
        gl_Position = vec4(v * 2. - 1., 0, 1);
    }
`, await (await fetch('frag2.glsl')).text())
const uTexture1 = gl.getUniformLocation(program2, 'uTexture1')
const uTexture2 = gl.getUniformLocation(program2, 'uTexture2')
const uTexture3 = gl.getUniformLocation(program2, 'uTexture3')
const uRand = gl.getUniformLocation(program2, 'uRand')

const framebuffer = gl.createFramebuffer()
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

gl.disable(gl.BLEND)

let txtSwitch = false
let ta = 0
let prevMouse = Vec2()

let exposure = 1.0
let mouseHoldCounter = 0.0

engine.on('frame', dt => {
    if (engine.keys.up) exposure += 0.01
    if (engine.keys.down) exposure -= 0.01
    exposure = clamp(exposure, 0.065, 0.18)
    const sp = sqrt((engine.mouse.x - prevMouse.x) ** 2 + (engine.mouse.y - prevMouse.y) ** 2)
    // console.log(sp)
    for (let i = 0; i < 70; ++i) {
        ta += 1
        const w = canvas.width
        const h = canvas.height
        
        if (engine.keys.lmb)
            mouseHoldCounter += 0.01
        else 
            mouseHoldCounter -= 0.01

        mouseHoldCounter = clamp(mouseHoldCounter, 0, 1)

        txtSwitch = !txtSwitch
    
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    
        if (engine.keys.lmb) {
            gl.enable(gl.SCISSOR_TEST)
            gl.scissor(
                floor(engine.mouse.x * canvas.width),
                floor(engine.mouse.y * canvas.height),
                1,
                1
            )
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, null, 0)
        
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, txtSwitch ? txt1 : txt3, 0)
            gl.clearColor(
                sin(ta / 2), 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT)
            
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, txtSwitch ? txt2 : txt4, 0)
            // gl.clearColor(0, 0, 0, 1)
            // gl.clear(gl.COLOR_BUFFER_BIT)
        
            gl.disable(gl.SCISSOR_TEST)
        }
    
        gl.useProgram(program2)
        gl.uniform1i(uTexture1, 0)
        gl.uniform1i(uTexture2, 1)
        gl.uniform1i(uTexture3, 2)
        gl.uniform1f(uRand, random())

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, txtSwitch ? txt1 : txt3) 
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, txtSwitch ? txt3 : txt1, 0)
    
        gl.activeTexture(gl.TEXTURE0 + 1)
        gl.bindTexture(gl.TEXTURE_2D, txtSwitch ? txt2 : txt4) 
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, txtSwitch ? txt4 : txt2, 0)
    
        gl.activeTexture(gl.TEXTURE0 + 2)
        gl.bindTexture(gl.TEXTURE_2D, txt5) 

        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    gl.useProgram(program1)
    gl.uniform1i(uTexture, 0)
    gl.uniform2f(uTextureSize, canvas.width, canvas.height)
    gl.uniform1f(uExposure, exposure)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, txtSwitch ? txt3 : txt1)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)


    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    prevMouse.x = engine.mouse.x
    prevMouse.y = engine.mouse.y
})