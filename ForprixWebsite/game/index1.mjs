import { Game } from './game.mjs'
import { sampleShaders } from './gfx.mjs'

const game = new Game('canvas')
const gfx = game.gfx

game.preventDefaultKeyBehaviours({ all: true }).autoFillParent(true)
const prog1 = gfx.createProgram(/*glsl*/`
    out vec2 vUV;
    void main() {
        int bits = gl_VertexID % 3 + gl_VertexID / 3;
        vec2 v = vec2(bits >> 1 & 1, bits & 1);
        vUV = v;
        gl_Position = vec4(v * 2. - 1., 0, 1);
    }`,
    await game.asset('glsl/blocks.glsl', 'string')
)
gfx.useProgram(prog1)

const chunk = {
    placedBlocks: new Uint16Array(16 * 16 * 4),
    assetBlocks: [
        {
            // air
            states: [ [0, 0, 0] ],
            colours: [ [null, null, null, null, null, null, null, null] ],
            tiles: await game.asset('images/air.png')
        },
        {
            // planks
            states: [
                [15, 0, 30],
                [15, 0, 31],
                [15, 0, 32],
                [15, 0, 33],
                [15, 0, 34],
                [15, 0, 35],
                [15, 0, 36],
                [15, 0, 37],
                [15, 0, 38]
            ],
            colours: [
                [null, null, [69, 50, 50], [110, 70, 60], [132, 92, 74], [159, 119, 97], null, null],
                [null, null, [35, 29, 26], [45, 32, 26], [60, 41, 31], [88, 55, 42], null, null],
                [null, null, [143, 108, 93], [195, 157, 121], [220, 186, 143], [229, 208, 162], null, null]
            ],
            tiles: await game.asset('images/planks.png')
        },
    ]
}

// - world blocks:
//    state offset
//    colour offset
//    connection
//
// - states:
//  * fill
//    mask
//    overlay
//  * ...
//
// - colours:
//  * colour 1
//    colour 2
//    colour 3
//    colour 4
//    colour 5
//    colour 6
//    colour 7
//    colour 8
//  * ...
//
// - tiles:
//    just tiles lol

function gen() {

    // TODO:
    // gfx.setTextureDefaults(
    //     null, null, null, 
    //     { autoMipmap: false, mipmapStorage: 1 },
    //     { mipmap: false, filter: 'nearest' }
    // )


    const map4 = new Map
    const texture4 = gfx.createTexture('2d', 'static', 'rgba8', { autoMipmap: false, mipmapStorage: 1 }, { mipmap: false, filter: 'nearest' })
    game.canvasWork((cvs, ctx) => {
        const count = chunk.assetBlocks.reduce((a, b) => a + b.tiles.width / 10 * b.tiles.height / 10, 0)
        const side = Math.ceil(Math.sqrt(count))
        cvs.width = cvs.height = side * 10
        let i = 0
        for (const block of chunk.assetBlocks) {
            const {tiles} = block
            map4.set(block, i)
            for (let y = 0; y < tiles.height / 10; ++y)
                for (let x = 0; x < tiles.width / 10; ++x)
                    ctx.drawImage(tiles, x * 10, y * 10, 10, 10, (i * 10) % cvs.width, Math.floor((i * 10) / cvs.width) * 10, 10, 10), ++i
        }
        // download(cvs)
        texture4.write(cvs)
    })

    const map2 = new Map
    const texture2 = gfx.createTexture('2d', 'static', 'rgb32i', { autoMipmap: false, mipmapStorage: 1 }, { mipmap: false, filter: 'nearest' })
    {
        let arr = []
        for (const block of chunk.assetBlocks) {
            const o = map4.get(block)
            map2.set(block, arr.length)
            arr = arr.concat(block.states.map(x => x.map(x => x + o)).flat())
        }
        const side = Math.ceil(Math.sqrt(arr.length / 3))
        arr.push(...Array(side * side * 3 - arr.length).fill(0))
        console.log('state texture:')
        console.log(arr)
        texture2.write(new Int32Array(arr), [side, side])
    }

    const map3 = new Map
    const texture3 = gfx.createTexture('2d', 'static', 'rgba8', { autoMipmap: false, mipmapStorage: 1 }, { mipmap: false, filter: 'nearest' })
    {
        let arr = []
        for (const block of chunk.assetBlocks) {
            map3.set(block, arr.length)
            arr = arr.concat(block.colours.map(x => x.map((x, i) => x == null ? Array(3).fill(Math.min(32 * i, 255)) : x)).flat(2))
        }
        const side = Math.ceil(Math.sqrt(arr.length / 4))
        arr.push(...Array(side * side * 4 - arr.length).fill(0))
        console.log('colour texture:')
        console.log(arr)
        texture3.write(new Uint8Array(arr), [side, side])
    }

    const texture1 = gfx.createTexture('2d', 'static', 'rgb16i', { autoMipmap: false, mipmapStorage: 1 }, { mipmap: false, filter: 'nearest' })
    {
        const arr = []
        const placedBlocks = chunk.placedBlocks
        const assetBlocks = chunk.assetBlocks
        for (let i = 0; i < placedBlocks.length; i += 4) {
            const block = assetBlocks[placedBlocks[i + 0]]
            // TODO: Additional check if block/state/colour doesn't exists
            arr.push(
                map2.get(block) + placedBlocks[i + 1] * 3,
                map3.get(block) + placedBlocks[i + 2] * 8,
                placedBlocks[i + 3]
            )
        }
        console.log('world blocks:')
        console.log(arr)
        texture1.write(new Int16Array(arr), [16, 16])
    }

    

    // NOTE: Блок добавлен/удалён = write texture2, texture3 и texture4
    // NOTE: Блок поставлен/снесён = subwrite texture1
}
gen()

game.on('update', (dt) => {
    // game.getKeyDown('qwe')
    // game.getKeyUp('qwe')
    gfx.uniforms.uTime.set(game.time)
    gfx.drawVertices('triangles', 6)
})

game.on('resize', (size) => {
    gfx.viewport(0, 0, ...size)
})