
import {$1, $clamp} from '/util.mjs'
import { initialize, assumeFormats, formats, getDecodableFormats, getEncodableFormats } from './formats.mjs'

onclick = (async () => {

const files = await new Promise(res => {
    const input = document.createElement('input')
    input.type = 'file'
    input.click()
    input.onchange = e => res(e.target.files)
})
/** @type {File} */
const file = files[0]

const buffer = await new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = e => res(e.target.result)
    reader.onerror = rej
    reader.readAsArrayBuffer(file)
})

await initialize()

const format = (await assumeFormats(buffer, { mimeType: file.type }))[0]

await format.init?.()

const decoded = await format.decode(
    buffer,
    (progress) => {
        console.log(`Decoding: ${progress * 100}%`)
    }
)

const encoded = await formats.wav.encode(
    decoded,
    (progress) => {
        console.log(`Encoding: ${progress * 100}%`)
    }, {
        bitDepth: 'int8',
        numberOfChannels: 1,
        sampleRate: 8000
    }
)

// Download the file
const blob = new Blob([encoded], { type: formats.wav.mime[0] })
const el = document.createElement('a')
el.href = URL.createObjectURL(blob)
el.download = `file.${formats.wav.ext[0]}`
el.click()
URL.revokeObjectURL(el.href)
    
})