import { $1 } from '/util.mjs'
import './jszip.js'

function causeDownload(data, fileName) {
    const blob = new Blob([data], { type: 'application/octet-stream' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
}

const deriveKey = async (password, salt) => await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256', },
    await crypto.subtle.importKey('raw', password, { name: 'PBKDF2' }, false, ['deriveKey']),
    { name: 'AES-GCM', length: 256 },
    true, ['encrypt', 'decrypt']
)

async function encrypt(data, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(password, salt), data)
    const r = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    r.set(salt, 0)
    r.set(iv, salt.length)
    r.set(new Uint8Array(encrypted), salt.length + iv.length)
    return r
}

async function decrypt(data, password) {
    const salt = data.slice(0, 16)
    const iv = data.slice(16, 28)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await deriveKey(password, salt), data.slice(28))
    return new Uint8Array(decrypted)
}

// TODO: Добавить адрес работы
// TODO: Найти старые видосы
// TODO: Сортировать по датам

// $1('.decrypt-button').on('click', e => {
//     console.log($1('.password-textbox').innerText.trim())
// })

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let unitIndex = 0
    let value = bytes

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex++
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`
}

const keyEbanat = new Uint8Array([90,64,189,106,90,56,229,201,100,10,217,112,32,10,86,93,157,246,136,25,194,238,12,208,233,193,139,132,249,233,113,199,45,224,114,192,107,159,93,132,174,155,217,8,207,251,78,20,98,38,88,138,219,238,5,214,135,247,53,49,47,231,32,53,84,83,176,5,49,2,190,71,77,62,240,98,43,238,251,157,143,44,228,192,31,57,233,251,129,23,179,74,92,36,7,234,34,75,200,24,29,46,191,194,238,157,108,199,201,248,22,231,128,144,3,188,84,178,31,100,179,85,191,45,13,185,197,154,15,140,32,183,89,102,13,49,251,178,45,1,188,10,118,242,189,48,59,1,88,64,250,153,11,90,180,197,80,217,67,151,171,81,174,251,159,42,14,183,188,122,5,62,46,180,175,169,18,79,217,245,162,37,71,218,244,94,134,216,110,143,227,1,236,200,40,121,57,230,124,53,141,229,95,203,125,161,90,188,15,48,61,252,33,74,196,223,173,81,32,158,192,171,116,238,52,69,38,160,216,179,19,44,180,145,118,43,181,224,193,168,234,204,47,209,138,57,182,49,163,155,105,237,44,157,95,102,237,217,147,22,67,144,236,109,155,65,138,40,231,38,42,15,179,104,192,27,203,222,176,163,96,234,217,207,216,221,143,230,226,143,54,113,226,243,161,238,83,97,5,217])
{
    const labelEl = $1('.label')
    const downloadProgressEl = $1('.download-bar-progress')
    let downloading = false
    async function activation() {
        if (downloading) return 
        const password = new TextEncoder().encode(input.innerText.trim())

        labelEl.style.color = 'rgb(105, 147, 236)'
        labelEl.innerText = `Чекаю парольчик`

        let passwordNice = true
        let psw
        try { psw = await decrypt(keyEbanat, password)  }
        catch { passwordNice = false }

        if (!passwordNice) {
            labelEl.style.color = 'rgb(238, 85, 85)'
            labelEl.innerText = 'Пароль говно!'
            return
        }

        try {
            
            labelEl.style.color = 'rgb(105, 147, 236)'
            labelEl.innerText = `Нихуя, пароль адеквабельный! Качаем...`
            downloading = true
            document.body.classList.add('downloading')

            let receivedLength = 0
            const chunks = []

            for (let i = 0; i <= 37; ++i) {
                const response = await fetch(`./data/part${i}.bin`)

                const reader = response.body.getReader()
            
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    receivedLength += value.length
                    downloadProgressEl.style.width = `${Math.round((receivedLength / 1981210260) * 100)}%`
                    chunks.push(value)
                }
            }

            const fullArrayBuffer = new Uint8Array(receivedLength)
            let offset = 0
            for (const chunk of chunks) {
                fullArrayBuffer.set(chunk, offset)
                offset += chunk.length
            }
          

            labelEl.style.color = 'rgb(111, 243, 199)'
            downloadProgressEl.style.background = 'rgb(111, 243, 199)'
            labelEl.innerText = 'Расшифровка... 10-30 секунд'
            const decrypted = await decrypt(fullArrayBuffer, psw)
            labelEl.style.color = 'rgb(124, 255, 98)'
            downloadProgressEl.style.background = 'rgb(124, 255, 98)'
            labelEl.innerText = 'Наслаждайся (Чекни загрузки)'
            document.body.classList.remove('downloading')
            document.body.classList.add('downloaded')
            causeDownload(decrypted, 'архив.zip')
        } catch (e) {
            labelEl.style.color = 'rgb(238, 85, 85)'
            labelEl.innerText = 'Произошла непонятная ошибка'
            console.log(e)
        }
    }
    $1('.password-bar-button').addEventListener('click', () => {
        activation()
    })

    const input = $1('.password-bar-input')
    input.addEventListener('keypress', (evt) => {
        if (evt.code == 'Enter') {
            evt.preventDefault()
            activation()
        }
    })
    input.addEventListener('input', () => {
        if (input.innerText == '' || input.innerText == '\n') {
            $1('.password-bar-placeholder').style = ''
        }
        else {
            $1('.password-bar-placeholder').style = 'display: none;'
        }
    })
}


// const packer = new JSZip()
// packer.file('Blowjob Nigger 7 (2).mp4', await (await fetch('./some-files/Blowjob Nigger 7 (2).mp4')).arrayBuffer())
// // ...
// const data = await packer.generateAsync({ type: 'arrayBuffer' })