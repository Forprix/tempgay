import { Game } from './game.mjs'
import { Matrix2D, sampleShaders } from './gfx.mjs'

const game = new Game('canvas')
const gfx = game.gfx

game.preventDefaultKeyBehaviours({ all: true }).autoFillParent(true)
const prog1 = gfx.createProgram(/*glsl*/`
    out vec2 vUV;
    uniform mat3 uTransform;
    void main() {
        int bits = gl_VertexID % 3 + gl_VertexID / 3;
        vec2 v = vec2(bits >> 1 & 1, bits & 1);
        vUV = v;
        gl_Position = vec4((uTransform * vec3(v * 2. - 1., 1)).xy, 0, 1);
    }`,
    /*glsl*/`
    out vec4 fragColor;
    void main() {
        fragColor = vec4(0, 1, 0, 1);
    }`
)
const prog2 = gfx.createProgram(
    sampleShaders.vertex.yFlippedFullscreenNoBuffer,
    sampleShaders.fragment.passThrough
)
const renderTexture = gfx.createTexture('2d', 'dynamic', 'rgba8', {autoMipmap: false}, {filter: 'nearest', mipmap: 0, wrap: 'clamp'})
const screen = gfx.createScreen(renderTexture)
gfx.setTextureSlot(0, renderTexture)

game.on('tick', (dt) => {
    gfx.useProgram(prog1).useScreen(screen)
    const transform = Matrix2D.identity()
    if (game.ratio > 1)
        transform.scale(1 / game.ratio, 1)
    else
        transform.scale(1, game.ratio)
    gfx.uniforms.uTransform.set(transform)
    gfx.clear().drawVertices('triangles', 6)

    gfx.useProgram(prog2).useScreen(null)
    gfx.uniforms.uTextureID.set(0)
    gfx.clear().drawVertices('triangles', 6)
})

game.on('resize', (size) => {
    gfx.viewport(0, 0, ...size)
    screen.resize(...size)
})