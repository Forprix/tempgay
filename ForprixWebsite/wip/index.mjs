import { $1, $fmod, $hsv2rgb, $time, $shuffle, $sleep, $choice } from '/util.mjs'


/** @type {HTMLCanvasElement} */
const canvas = $1('canvas')
const gl = canvas.getContext('webgl2')

const blurRadius = 1

const qualityScale = 1 / 16
const speed = 0.25

let program2 // second program (shift noise)
let program3 // 1-st pass of 2-pass gaussian blur
let program4 // 2-nd pass of 2-pass gaussian blur
let program5 // scaler

let texture2
let texture3

let framebuffer1
let framebuffer2

function createProgram2() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, `#version 300 es
        precision highp float;
        precision highp sampler2D;
        const vec2 cUVs[] = vec2[](vec2(1, 1), vec2(-1, 1), vec2(-1, -1), vec2(-1, -1), vec2(1, -1), vec2(1, 1));
        out vec2 vUV;
        void main(void) {
            gl_Position = vec4(cUVs[gl_VertexID], 0.0, 1.0);
            vUV = cUVs[gl_VertexID] / 2.0 + 0.5;
        }
    `)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader))

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, `#version 300 es
        precision highp float;

        uniform float uTime;
        in vec2 vUV;
        out vec4 glFragColor;
        
        vec3 hsv2rgb(vec3 hsv) {
            vec3 rgb;
            float c = hsv.y * hsv.z;
            float x = c * (1.0 - abs(mod((hsv.x / 60.0), 2.0) - 1.0));
            float m = hsv.z - c;
            
            if (hsv.x >= 0.0 && hsv.x < 60.0) {
                rgb = vec3(c, x, 0.0);
            } else if (hsv.x >= 60.0 && hsv.x < 120.0) {
                rgb = vec3(x, c, 0.0);
            } else if (hsv.x >= 120.0 && hsv.x < 180.0) {
                rgb = vec3(0.0, c, x);
            } else if (hsv.x >= 180.0 && hsv.x < 240.0) {
                rgb = vec3(0.0, x, c);
            } else if (hsv.x >= 240.0 && hsv.x < 300.0) {
                rgb = vec3(x, 0.0, c);
            } else if (hsv.x >= 300.0 && hsv.x < 360.0) {
                rgb = vec3(c, 0.0, x);
            } else {
                rgb = vec3(0.0);
            }
            
            return rgb + m;
        }

        float fmod(float x, float y) {
            return x - y * floor(x / y);
        }
        
        float getRandomFloat(vec2 seed) {
            return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453 + sin(dot(seed.yx, vec2(93.989, 27.345))) * 23456.789);
        }
        
        void main(void) {
            vec3 hsv = vec3(0.0);
            float initial = getRandomFloat(vUV*3.1576) * 360.0;
            float speed = getRandomFloat(vUV) * float(${speed});
            hsv.x = fmod(initial + uTime * 360.0 * speed, 360.0);
            hsv.y = 1.0;
            hsv.z = 1.0;
            glFragColor = vec4(hsv2rgb(hsv), 1.0);
        }
    `)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader))
    
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    return program
}
function createProgram3() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, `#version 300 es
        precision highp float;
        precision highp sampler2D;
        const vec2 cUVs[] = vec2[](vec2(1, 1), vec2(-1, 1), vec2(-1, -1), vec2(-1, -1), vec2(1, -1), vec2(1, 1));
        out vec2 vUV;
        void main(void) {
            gl_Position = vec4(cUVs[gl_VertexID], 0.0, 1.0);
            vUV = cUVs[gl_VertexID] / 2.0 + 0.5;
        }
    `)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader))

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, `#version 300 es
        precision highp float;

        uniform ivec2 uCanvasSize;
        uniform sampler2D uTextureID;
        in vec2 vUV;
        out vec4 glFragColor;

        void main(void) {
            ivec2 coord = ivec2(int(vUV.x * float(uCanvasSize.x)), int(vUV.y * float(uCanvasSize.y)));
            vec3 rgb = vec3(0, 0, 0);
            float weightSum = 0.0;
            for (int i = -${blurRadius}; i <= ${blurRadius}; i++) {
                float weight = exp(-float(i * i) / (2.0 * float(${blurRadius})));
                weightSum += weight;
                rgb += texelFetch(uTextureID, ivec2(coord.x + i, coord.y), 0).xyz * weight;
            }
            glFragColor = vec4(rgb / weightSum, 1.0);
        }
    `)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader))
    
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    return program
}
function createProgram4() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, `#version 300 es
        precision highp float;
        precision highp sampler2D;
        const vec2 cUVs[] = vec2[](vec2(1, 1), vec2(-1, 1), vec2(-1, -1), vec2(-1, -1), vec2(1, -1), vec2(1, 1));
        out vec2 vUV;
        void main(void) {
            gl_Position = vec4(cUVs[gl_VertexID], 0.0, 1.0);
            vUV = cUVs[gl_VertexID] / 2.0 + 0.5;
        }
    `)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader))

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

    gl.shaderSource(fragmentShader, `#version 300 es
        precision highp float;

        uniform ivec2 uCanvasSize;
        uniform sampler2D uTextureID;
        in vec2 vUV;
        out vec4 glFragColor;

        vec3 rgb2hsv(vec3 rgb) {
            vec3 hsv;
            float cMax = max(max(rgb.r, rgb.g), rgb.b);
            float cMin = min(min(rgb.r, rgb.g), rgb.b);
            float delta = cMax - cMin;
            if (delta == 0.0) {
                hsv.x = 0.0;
            } else if (cMax == rgb.r) {
                hsv.x = mod((rgb.g - rgb.b) / delta, 6.0);
            } else if (cMax == rgb.g) {
                hsv.x = ((rgb.b - rgb.r) / delta) + 2.0;
            } else {
                hsv.x = ((rgb.r - rgb.g) / delta) + 4.0;
            }
            hsv.x *= 60.0;
            if (hsv.x < 0.0) {
                hsv.x += 360.0;
            }
            if (cMax == 0.0) {
                hsv.y = 0.0;
            } else {
                hsv.y = delta / cMax;
            }
            hsv.z = cMax;
            
            return hsv;
        }

        vec3 hsv2rgb(vec3 hsv) {
            vec3 rgb;
            float c = hsv.y * hsv.z;
            float x = c * (1.0 - abs(mod((hsv.x / 60.0), 2.0) - 1.0));
            float m = hsv.z - c;
            
            if (hsv.x >= 0.0 && hsv.x < 60.0) {
                rgb = vec3(c, x, 0.0);
            } else if (hsv.x >= 60.0 && hsv.x < 120.0) {
                rgb = vec3(x, c, 0.0);
            } else if (hsv.x >= 120.0 && hsv.x < 180.0) {
                rgb = vec3(0.0, c, x);
            } else if (hsv.x >= 180.0 && hsv.x < 240.0) {
                rgb = vec3(0.0, x, c);
            } else if (hsv.x >= 240.0 && hsv.x < 300.0) {
                rgb = vec3(x, 0.0, c);
            } else if (hsv.x >= 300.0 && hsv.x < 360.0) {
                rgb = vec3(c, 0.0, x);
            } else {
                rgb = vec3(0.0);
            }
            
            return rgb + m;
        }

        float fmod(float x, float y) {
            return x - y * floor(x / y);
        }

        void main(void) {
            ivec2 coord = ivec2(int(vUV.x * float(uCanvasSize.x)), int(vUV.y * float(uCanvasSize.y)));
            vec3 rgb = vec3(0, 0, 0);
            float weightSum = 0.0;
            for (int i = -${blurRadius}; i <= ${blurRadius}; i++) {
                float weight = exp(-float(i * i) / (2.0 * float(${blurRadius})));
                weightSum += weight;
                rgb += texelFetch(uTextureID, ivec2(coord.x, coord.y + i), 0).xyz * weight;
            }
            rgb /= weightSum;
            vec3 hsv = rgb2hsv(rgb);

            hsv[1] = 0.7;
            hsv[2] = 1.0;

            vec3 rgb2 = hsv2rgb(hsv);
            rgb2.r = pow(rgb2.r, 2.) * 0.4 + 0.12;
            rgb2.b = rgb2.r;
            rgb2.g = rgb2.r;

            glFragColor = vec4(rgb2, 1.0);
        }
    `)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader))
    
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    return program
}
function createProgram5() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, `#version 300 es
        precision highp float;
        precision highp sampler2D;
        const vec2 cUVs[] = vec2[](vec2(1, 1), vec2(-1, 1), vec2(-1, -1), vec2(-1, -1), vec2(1, -1), vec2(1, 1));
        out vec2 vUV;
        void main(void) {
            gl_Position = vec4(cUVs[gl_VertexID], 0.0, 1.0);
            vUV = cUVs[gl_VertexID] / 2.0 + 0.5;
        }
    `)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader))

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, `#version 300 es
        precision highp float;

        uniform sampler2D uTextureID;
        in vec2 vUV;
        out vec4 glFragColor;

        void main(void) {
            glFragColor = texture(uTextureID, vUV);
        }
    `)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader))
    
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    return program
}

function init1() {
    gl.enable(gl.DEPTH_TEST)
    
    program2 = createProgram2()
    program3 = createProgram3()
    program4 = createProgram4()
    program5 = createProgram5()

    texture2 = gl.createTexture()
    texture3 = gl.createTexture()

    framebuffer1 = gl.createFramebuffer()
    framebuffer2 = gl.createFramebuffer()
    
}

function init2() {
    // Allocate texture2 and texture3
    {
        gl.bindTexture(gl.TEXTURE_2D, texture2)
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            canvas.width * qualityScale, canvas.height * qualityScale,
            0, gl.RGBA, gl.UNSIGNED_BYTE, null
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

        gl.bindTexture(gl.TEXTURE_2D, texture3)
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            canvas.width, canvas.height,
            0, gl.RGBA, gl.UNSIGNED_BYTE, null
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    }

    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0)

    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture3, 0)
}

const r = Math.random() * 10000
const t = () => {
    return performance.now() + r
}
const el1 = document.querySelector('.title')
const el2 = document.querySelector('.subtitle')

let pos = [0.5, 0.5]
let vel = [0, 0]
let pos1 = [0.5, 0.5]
let vel1 = [0, 0]
let mousePos = [0.5, 0.5]
onmousemove = e => {
    mousePos = [e.clientX / document.body.clientWidth , e.clientY / document.body.clientHeight]
}

let t1 = performance.now()
function frame() {
    const t0 = performance.now()
    const dt = t0 - t1
    vel[0] += (mousePos[0] - pos[0]) * dt * 0.01
    vel[1] += (mousePos[1] - pos[1]) * dt * 0.01
    vel[0] *= 0.8
    vel[1] *= 0.8
    vel1[0] += (mousePos[0] - pos1[0]) * dt * 0.004
    vel1[1] += (mousePos[1] - pos1[1]) * dt * 0.004
    vel1[0] *= 0.86
    vel1[1] *= 0.86

    const ppos = [pos[0], pos[1]]
    const ppos1 = [pos1[0], pos1[1]]
    pos[0] = pos[0] + vel[0] * dt * 0.01
    pos[1] = pos[1] + vel[1] * dt * 0.01
    pos1[0] = pos1[0] + vel1[0] * dt * 0.01
    pos1[1] = pos1[1] + vel1[1] * dt * 0.01
    t1 = t0
    el1.style = `transform: translate(${Math.round((pos[0] - 0.5) * 0.5 * document.body.clientWidth * 10) / 10}px, ${Math.round((pos[1] - 0.5) * 0.5 * document.body.clientHeight * 10) / 10}px) rotate(${Math.round((ppos[0] - pos[0]) * 60 * 1000) / 1000}deg)`
    el2.style = `transform: translate(${Math.round((pos1[0] - 0.5) * 0.5 * document.body.clientWidth * 10) / 10}px, ${Math.round((pos1[1] - 0.5) * 0.5 * document.body.clientHeight * 10) / 10}px) rotate(${Math.round((ppos1[0] - pos1[0]) * 60 * 1000) / 1000}deg)`

    // Хуешифтнуть пиксели цветного шума
    {
        gl.useProgram(program2)
        const uniformLocation = gl.getUniformLocation(program2, 'uTime')
        gl.uniform1f(uniformLocation, performance.now() / 1000)
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, ~~(canvas.width * qualityScale), ~~(canvas.height * qualityScale))
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1)

        // Draw to texture2 instead of screen
    }

    // Вертикальный блюр
    {
        gl.useProgram(program3)
        const uniform1Location = gl.getUniformLocation(program3, 'uCanvasSize')
        gl.uniform2iv(uniform1Location, [canvas.width * qualityScale, canvas.height * qualityScale])
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture2)
        const textureSamplerLocation = gl.getUniformLocation(program3, 'uTextureID')
        gl.uniform1i(textureSamplerLocation, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, canvas.width * qualityScale, canvas.height * qualityScale)
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1)
    }

    // Горизонтальный блюр
    {
        gl.useProgram(program4)
        const uniform1Location = gl.getUniformLocation(program4, 'uCanvasSize')
        gl.uniform2iv(uniform1Location, [canvas.width * qualityScale, canvas.height * qualityScale])
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture3)
        const textureSamplerLocation = gl.getUniformLocation(program4, 'uTextureID')
        gl.uniform1i(textureSamplerLocation, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, canvas.width * qualityScale, canvas.height * qualityScale)
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1)

    }

    {
        gl.useProgram(program5)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture2)
        const textureSamplerLocation = gl.getUniformLocation(program5, 'uTextureID')
        gl.uniform1i(textureSamplerLocation, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1)

    }
    gl.finish()

    requestAnimationFrame(frame)
}
init1()
init2()
frame()

;(async () => {
    while (true) {
        await $sleep(1)
        const str = $choice(['Goodness is coming', 'Work in progess', 'To be continued', 'Coming soon'])
        for (let i = 0; i < 10; ++i) {
            el2.innerText = Array(str.length).fill().map(x => $choice('`~!@#$%^&*()_+-={}[]:";\'./>?<,\\|'.split(''))).join('')
            await $sleep(0.02)
        }
        el2.innerText = str
        await $sleep(0.2)
        el2.innerText += '.'
        await $sleep(0.2)
        el2.innerText += '.'
        await $sleep(0.2)
        el2.innerText += '.'
    }
})()

new ResizeObserver(() => {
    if (innerWidth == 0 || innerHeight == 0) return;
    canvas.width = innerWidth
    canvas.height = innerHeight
    init2()
}).observe(document.body)