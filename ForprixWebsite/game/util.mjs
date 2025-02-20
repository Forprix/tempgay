/** @type {(url: string) => Promise<Blob>} */
const downloadBlob = (url) => {
    return new Promise((res, rej) => {
        const xml = new XMLHttpRequest()
        xml.responseType = 'blob'
        xml.open('GET', url, true)
        
        xml.onloadend = () => res(xml.response)
        
        xml.onerror = rej
        xml.send()
    })
}

export async function asset(url, format) {
    const fmt = format ?? url.match(/(?<=\.)[a-zA-Z0-9_\-]+$/)?.[0]
    switch (fmt) {
        case 'txt':
            return await (await fetch(url)).text()
        case 'bin':
            return await (await fetch(url)).arrayBuffer()
        case 'wasm':
            return (await WebAssembly.instantiate(await (await fetch(url)).arrayBuffer(), {})).instance.exports
        case 'json':
            return await (await fetch(url)).json()
        case 'png':
            return await createImageBitmap(await downloadBlob(url))
            // return await createImageBitmap(await downloadBlob(url), { imageOrientation: 'flipY' })
        default:
            return await (await fetch(url)).arrayBuffer()
    }
}