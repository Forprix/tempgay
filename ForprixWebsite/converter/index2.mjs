// ВЫБРАНЫ 2 ФОРМАТА
// НУЖНО ПОЛУЧИТЬ НАСТРОЙКИ ДЛЯ НАСТРОЕК
import {$1, $clamp} from '/util.mjs'
import { initialize, deduceFormats, formats, getDecodableFormats, getEncodableFormats } from './formats.mjs'

// https://github.com/cstoquer/audio-encoder
// MP3 + WAV

// https://github.com/zhuker/lamejs

let initialization = (async () => {
    await initialize()
    const [decodableFormats, encodableFormats] = await Promise.all([getDecodableFormats(), getEncodableFormats()])

    const srcFormatsEl = $1('.src-formats-header')
    const dstFormatsEl = $1('.dst-formats-header')

    // for (const format of decodableFormats) {
    //     const el = document.createElement('div')
    //     el.innerHTML = `<div>${format.name}</div>`
    //     el.addEventListener('click', () => {
    //         srcFormatsEl.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
    //         el.classList.add('selected')
    //     })
    //     el.setAttribute('data-format', format.name)
    //     srcFormatsEl.appendChild(el)
    // }
    for (const format of encodableFormats) {
        const el = document.createElement('div')
        el.addEventListener('click', () => {
            dstFormatsEl.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
            el.classList.add('selected')
        })
        el.setAttribute('data-format', format.name)
        el.innerHTML = `<div>${format.name}</div>`
        dstFormatsEl.appendChild(el)
    }

    if (srcFormatsEl.firstElementChild)
        srcFormatsEl.firstElementChild.classList.add('selected')
    if (dstFormatsEl.firstElementChild)
        dstFormatsEl.firstElementChild.classList.add('selected')

    // src-formats-header
    initialization = false
})()

// Source Drag&Drop
{
    const dropAreaEl = $1('.src-drop-area')
    function preventDefault(e) {
        e.preventDefault()
        e.stopPropagation()
    }
    function highlightDropArea(e) {
        dropAreaEl.classList.add('highlight')
    }
    function unhighlightDropArea(e) {
        dropAreaEl.classList.remove('highlight')
    }
    function handleDrop(e) {
        unhighlightDropArea(e)
        preventDefault(e)
        const files = e.dataTransfer.files
        for (const file of files)
            filePenis(file)
    }
    dropAreaEl.on('dragenter', highlightDropArea)
    dropAreaEl.on('dragleave', unhighlightDropArea)
    dropAreaEl.on('dragover',  preventDefault)
    dropAreaEl.on('drop',      handleDrop)
}

function downloadBlob(blob, filename) {
    const el = document.createElement('a')
    el.href = URL.createObjectURL(blob)
    el.download = filename
    el.click()
    URL.revokeObjectURL(el.href)
}

async function filePenis(file) {
    if (initialization)
        await initialization

    const buffer = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = e => res(e.target.result)
        reader.onerror = rej
        reader.readAsArrayBuffer(file)
    })

    const guessedFormats = await deduceFormats(buffer, {
        mimeType: file.type,
        mustSupportDecoding: true
    })

    if (guessedFormats.length == 0)
        throw 'Unknown format'

    // If multiple, let user pick one
   
    const firstFormat = guessedFormats[0]

    const decoded = await firstFormat.decode(buffer)


    const dstFormatName = $1('.dst-formats-header .selected').dataset.format
    const dstFormat = Object.values(formats).find(x => x.name == dstFormatName)
    console.log(file)

    const blobOut = await dstFormat.encode(decoded)

    downloadBlob(blobOut, `${file.name.replace(/\.[^.]*$/, '')}.${dstFormat.ext[0]}`)

    //const imageData = await any2image(fileBlob)

    //const dstBlob = new Blob([image2bmp(imageData)], { type: 'image/bmp' })
    
    //downloadBlob(dstBlob, 'blowjob.bmp')
}
