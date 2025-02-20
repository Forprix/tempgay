
function arraysEqual(arr1, arr2) {
    const maxLen = Math.max(arr1.length, arr2.length)
    for (let i = 0; i < maxLen; ++i)
        if (arr1[i] !== arr2[i])
            return false
    return true
}

function base64ToBuffer(str) {
    const splitted = str.split(',')
    if (splitted[0].endsWith(';base64')) {
        const bin = atob(splitted[1])
        const arr = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; ++i)
            arr[i] = bin.charCodeAt(i)
        return arr.buffer
    }
    return new TextEncoder().encode(splitted[1]).buffer
}

let supportedImageInFormats = []
let supportedImageOutFormats = []
let supportedAudioInFormats = []

const defaultImageDecodingMethod = async function(buffer) {
    const blob = new Blob([buffer], { type: this.mime[0] })
    const url = URL.createObjectURL(blob)
    const img = await new Promise((res, rej) => {
        const img = new Image()
        img.onload = () => res(img)
        img.onerror = rej
        img.src = url
    })
    URL.revokeObjectURL(url)
    return img
}
const defaultImageEncodingMethod = async function(img) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise(res =>
        canvas.toBlob(res, this.mime[0]) // Quality
    )
    return blob
}

/**
 * @typedef {Object} FormatDefinition
 * @property {string} name - Short name of format
 * @property {string} description - Long name of format
 * @property {string[]} mime - Mime types that satisfy the format
 * @property {string} rawType - Type that is returned when decoding and is required for encoding
 * @property {string[]} ext - File extensions associated with the format
 * @property {string} [min] - The minimal data of the format (temporary, will be removed)
 * @property {(buffer: ArrayBuffer) => Promise<boolean>} [assumeBySignature]
 * @property {() => Promise<boolean>} [decodingSupported]
 * @property {(prevSettings: any | undefined) => Promise<any>} [decodingSettings]
 * @property {(buffer: ArrayBuffer, onProgress: (progress: number) => void, options: any | undefined) => Promise<any>} [decode]
 * @property {() => Promise<boolean>} [encodingSupported]
 * @property {(prevSettings: any | undefined) => Promise<any>} [encodingSettings]
 * @property {(buffer: any, onProgress: (progress: number) => void, options: any | undefined) => Promise<ArrayBuffer>} [encode]
 * @property {(() => Promise)} [init]
 * @property {(() => Promise)} [load]
*/

/** @type {{ [format: string] : FormatDefinition }} */
export const formats = {
    png: {
        name: 'png',
        description: 'Portable Network Graphics',
        mime: ['image/png'],
        rawType: 'Image',
        ext: ['png'],
        min: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAADElEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
        assumeBySignature(buffer) {
            const signature = [137, 80, 78, 71, 13, 10, 26, 10]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return supportedImageOutFormats.includes(this) },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this)
            this.encode = defaultImageEncodingMethod.bind(this)
        },
        load() {

        }
    },
    jpeg: {
        name: 'jpeg',
        description: 'Joint Photographic Experts Group',
        mime: ['image/jpeg'],
        rawType: 'Image',
        ext: ['jpg', 'jpeg'],
        min: 'data:image/jpeg;base64,/9j/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=',
        assumeBySignature(buffer) {
            const signature = [0xFF, 0xD8]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return supportedImageOutFormats.includes(this) },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this)
            this.encode = defaultImageEncodingMethod.bind(this)
        }
    },
    gif: {
        name: 'gif',
        description: 'Graphics Interchange Format',
        mime: ['image/gif'],
        rawType: 'Image',
        ext: ['gif'],
        min: 'data:image/gif;base64,R0lGODlhAQABAIABAAAAAP///yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        assumeBySignature(buffer) {
            const signature1 = [71, 73, 70, 56, 55, 97]
            const signature2 = [71, 73, 70, 56, 57, 97]
            return arraysEqual(signature1, buffer.slice(0, signature1.length)) ||
                arraysEqual(signature2, buffer.slice(0, signature2.length))
        },
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return supportedImageOutFormats.includes(this) },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this)
            this.encode = defaultImageEncodingMethod.bind(this)
        }
    },
    bmp: {
        name: 'bmp',
        description: 'Bitmap',
        mime: ['image/bmp'],
        rawType: 'Image',
        ext: ['bmp'],
        min: 'data:image/bmp;base64,Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAAAAADEDgAAxA4AAAAAAAAAAAAAAAAAAA==',
        assumeBySignature(buffer) {
            const signature = [66, 77]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return true },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this)
        },
        encode(img) {
            return image2bmp(img)
        }
    },
    webp: {
        name: 'webp',
        description: 'Google WebP Picture',
        mime: ['image/webp'],
        rawType: 'Image',
        ext: ['webp'],
        min: 'data:image/webp;base64,UklGRgoBAABXRUJQVlA4WAoAAAAIAAAAAAAAAAAAVlA4TA4AAAAvAAAAAAcQEf0PRET/A0VYSUbWAAAASUkqAAgAAAAGABIBAwABAAAAAQAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAADEBAgAQAAAAZgAAAGmHBAABAAAAdgAAAAAAAABgAAAAAQAAAGAAAAABAAAAcGFpbnQubmV0IDUuMC4yAAUAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAAAqAEAAEAAAABAAAAA6AEAAEAAAABAAAABaAEAAEAAAC4AAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAAA==',
        assumeBySignature(buffer) {
            const signature = [0x52, 0x49, 0x46, 0x46, 0x57, 0x45, 0x42, 0x50]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return supportedImageOutFormats.includes(this) },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this)
            this.encode = defaultImageEncodingMethod.bind(this)
        }
    },
    svg: {
        name: 'svg',
        description: 'Scalable Vector Graphics',
        mime: ['image/svg+xml'],
        rawType: 'Image',
        ext: ['svg'],
        min: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        assumeBySignature(buffer) {
            const decoder = new TextDecoder('utf-8')
            const text = decoder.decode(buffer.slice(0, 6))
            return /^\<\?xml |\<svg /.test(text)
        },
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return false },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this)
        }
    },
    ico: {
        name: 'ico',
        description: 'Icon',
        mime: ['image/vnd.microsoft.icon', 'image/x-icon'],
        rawType: 'Image',
        ext: ['ico'],
        min: 'data:image/vnd.microsoft.icon;base64,AAABAAEAAQEAAAEAGAAwAAAAFgAAACgAAAABAAAAAgAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAA==',
        decodingSupported() { return supportedImageInFormats.includes(this) },
        encodingSupported() { return supportedImageOutFormats.includes(this) },
        init() {
            this.decode = defaultImageDecodingMethod.bind(this),
            this.encode = defaultImageEncodingMethod.bind(this)
        }
    },
    mp3: {
        name: 'mp3',
        fullName: 'MPEG Audio Layer 3',
        mime: ['audio/mpeg'],
        rawType: 'Audio',
        ext: ['mp3', 'mpga', 'mpeg3', 'mp2'],
        min: 'data:audio/mpeg;base64,SUQzAwAAAAAAPFRZRVIAAAAFAAAAMjAyM1RFTkMAAAAVAAAATEFNRSBpbiBGTCBTdHVkaW8gMjBUQlBNAAAABAAAADEzMP/6EMwTPAADwAABpAAAACAAADSAAAAETEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMrmKIPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzHJnUYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMoYF6A8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDM0YqjA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EsyNVsuDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVV//oSzMLy1oPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//oQzG8f1wPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+hLMwvLWg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+hDMbx/XA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/6EszC8taDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/6EMxvH9cDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
        async decode(buffer, onProgress, options) {
            const ctx = new AudioContext()
            const audioBuffer = await ctx.decodeAudioData(buffer)
            onProgress(1)
            return audioBuffer
        },
        assumeBySignature(buffer) {
            const signature = [0x49, 0x44, 0x33]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
    },
    wav: {
        name: 'wav',
        fullName: 'Waveform Audio File Format',
        mime: ['audio/wav'],
        rawType: 'Audio',
        ext: ['wav', 'wave'],
        min: 'data:audio/wav;base64,UklGRpQAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgATElTVBoAAABJTkZPSVNGVA4AAABMYXZmNTguNzYuMTAwAGRhdGFNAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAA',
        assumeBySignature(buffer) {
            const signature1 = [0x52, 0x49, 0x46, 0x46]
            const signature2 = [0x57, 0x41, 0x56, 0x45]
            const signature2Position = 8
            return arraysEqual(signature1, buffer.slice(0, signature1.length)) &&
                arraysEqual(signature2, buffer.slice(signature2Position, signature2.length))
        },
        encode(audioBuffer, onProgress, options) {
            onProgress(1)
            return audio2wav(audioBuffer, options)
        }
    },
    ogg: {
        name: 'ogg',
        fullName: 'Ogg Vorbis',
        mime: ['audio/ogg'],
        rawType: 'Audio',
        ext: ['ogg', 'oga'],
        min: 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAAD+ZQAAAAAAAP18JLcBHgF2b3JiaXMAAAAAAUSsAAD/////AH0AAP/////JAU9nZ1MAAAAAAAAAAAAA/mUAAAEAAABkDo2yD4j/////////////////NQN2b3JiaXMsAAAAWGlwaC5PcmcgbGliVm9yYmlzIEkgMjAxNTAxMDUgKOKbhOKbhOKbhOKbhCkGAAAAEQAAAEVOQ09ERVI9RkwgU3R1ZGlvBgAAAFRJVExFPQYAAABHRU5SRT0HAAAAQVJUSVNUPQgAAABDT01NRU5UPQgAAABDT05UQUNUPQEFdm9yYmlzH0JDVgEAAAEAFGNWKWaZUpJbihlzmDFnGWPUWoolhBRCKKVzVlurKbWaWsq5xZxzzpViUilFmVJQW4oZY1IpBhlTEltpIYQUQgehcxJbaa2l2FpqObacc62VUk4ppBhTiEromFJMKaQYU4pK6Jxz0DnmnFOMSgg1lVpTyTGFlFtLKXROQgephM5SS7F0kEoHJXRQOms5lRJTKZ1jVkJquaUcU8qtpphzjIHQkFUAAAEAwEAQGrIKAFAAABCGoSiKAoSGrAIAMgAABOAojuIokiI5kmM5FhAasgoAAAIAEAAAwHAUSZEUy9EcTdIszdI8U5ZlWZZlWZZlWZZd13VdIDRkFQAAAQBAKAcZxRgQhJSyEggNWQUAIAAAAIIowxADQkNWAQAAAQAIUR4h5qGj3nvvEXIeIeYdg9577yG0XjnqoaTee++99x5777n33nvvkWFeIeehk9577xFiHBnFmXLee+8hpJwx6J2D3nvvvfeec+451957752j3kHpqdTee++Vk14x6Z2jXnvvJdUeQuqlpN5777333nvvvffee++9955777333nvvrefeau+9995777333nvvvffee++9995777333nvvgdCQVQAAEAAAYRg2iHHHpPfae2GYJ4Zp56T3nnvlqGcMegqx9557773X3nvvvffeeyA0ZBUAAAgAACGEEFJIIYUUUkghhhhiyCGHHIIIKqmkoooqqqiiiiqqLKOMMsook4wyyiyjjjrqqMPOQgoppNJKC620VFtvLdUehBBCCCGEEEIIIYQQvvceCA1ZBQCAAAAwxhhjjEEIIYQQQkgppZRiiimmmAJCQ1YBAIAAAAIAAAAsSZM0R3M8x3M8x1M8R3RER3RER5RE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IIxByCCEkEFIIaSQUkgppQQAAAw4AAAEmFAGCg1ZEQDECQAAiFBKKaXUUUoppZRSSimlklJKKaWUUkoppZRSSimlVFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFLqKKWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKqaSUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUUoppZRSSimllFJKKaWUSkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimVUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUAgCkIhwApB5MKAOFhqwEAFIBAABjlFIKOuicQ4wx5pyTTjqIGHOMOSmptJQ5ByGUlFJKKXPOQQillJRa5hyEklJLLaXMOQilpJRaS52UUlKqqbUWQymltFRTTS2WlFKKqdYYY00ptdRai7XG2lJrrcUYa6w1tVZbjC3GWmsBADgNDgCgBzasjnBSNBZYaMhKACAVAAAxRinGnIMQOoOQUs5BByGEBiGmnHMOOugUY8w5ByGEECrGGHMOQgghZM45Bx2EEkLJnHMOQgghlNJBCCGEEEoJpYMQQgghhFBKCKGEUEIopZQQQgghlFBKKSGEEkIpoZRSQgglhFBKKaUUAABY4AAAEGDD6ggnRWOBhYasBACAAAAgZaGGkCyAkGOQXGMYg1REpJRjDmzHnJNWROWUU05ERx1liHsxRuhUBAAAIAgACDABBAYICkYhCBDGAAAEITJDJBRWwQKDMmhwmAcADxAREgFAYoKi1YUL0MUALtCFuxwQgiAIgiAsGoACJMCBE9zgCW/wBDdwAh1FSR0EAAAAAIACAHwAABwUQEREcxUWFxgZGhscHR4BAAAAACAFAB8AAMcHEBHRXIXFBUaGxgZHh0cAAAAAAAAAAAAQEBAAAAAAAAgAAAAQEE9nZ1MABAc+AQAAAAAA/mUAAAIAAADCmfPpKgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAKDg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg==',
        assumeBySignature(buffer) {
            const signature = [0x4F, 0x67, 0x67, 0x53]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
    },
    flac: {
        name: 'flac',
        fullName: 'Free Lossless Audio Codec',
        mime: ['audio/flac'],
        rawType: 'Audio',
        ext: ['flac'],
        min: 'data:audio/flac;base64,ZkxhQwAAACIEgASAAAAMAAAMCsRA8AAAANT2FeIZF12SPho1GDaWqYyRhAAAdSAAAAByZWZlcmVuY2UgbGliRkxBQyAxLjMuMSAyMDE0MTEyNQYAAAARAAAARU5DT0RFUj1GTCBTdHVkaW8GAAAAVElUTEU9BgAAAEdFTlJFPQcAAABBUlRJU1Q9CQAAAENPTU1FTlRTPQgAAABDT05UQUNUPf/4aQgA0yoAAAApJQ==',
        assumeBySignature(buffer) {
            const signature = [0x66, 0x4C, 0x61, 0x43]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
    },
    webm: {
        name: 'webm',
        fullName: 'Google WebM Multimedia (Audio)',
        mime: ['audio/webm', 'video/webm'],
        rawType: 'Audio',
        ext: ['weba', 'webm'],
        min: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHgEU2bdKtNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggE/7AEAAAAAAABoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNTguNzYuMTAwV0GNTGF2ZjU4Ljc2LjEwMESJiAAAAAAAAAAAFlSua+KuAQAAAAAAAFnXgQFzxYjeQq9/3Q1jCZyBACK1nIN1bmSGhkFfT1BVU1aqg2MuoFa7hATEtACDgQLhkZ+BAbWIQOdwAAAAAABiZIEgY6KTT3B1c0hlYWQBATgBgLsAAAAAABJUw2dAm3NzAQAAAAAAACdjwIBnyAEAAAAAAAAaRaOHRU5DT0RFUkSHjUxhdmY1OC43Ni4xMDBzcwEAAAAAAABgY8CLY8WI3kKvf90NYwlnyAEAAAAAAAAjRaOHRU5DT0RFUkSHlkxhdmM1OC4xMzQuMTAwIGxpYm9wdXNnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjAwMDAwMDAwMAAA',
        assumeBySignature(buffer) {
            const signature = [0x1A, 0x45, 0xDF, 0xA3]
            return arraysEqual(signature, buffer.slice(0, signature.length))
        },
    },
}



// Что, если форматов станет 50+? Сделать Lazy Load
// В функции initialize подгружать Worker, ждать пока не загрузиться
// При вызове encode() / decode() обращаться к этому воркеру
// Внутри воркера, при обращении к новому алгоритму декодинга / энкодинга, fetch-ить его и в дальнейшем не отружать
// Как сделать индикацию загрузки кодека + индикацию кодирования?
// Удалить Init нахуй. Он не нужен пока что 



export async function initialize() {
    const imageFormats = Object.values(formats).filter(x => x.rawType == 'Image')
    const audioFormats = Object.values(formats).filter(x => x.rawType == 'Image')

    async function getSupportedImageInFormats() {
        const formats = []
        await Promise.all(imageFormats.map(fmt => new Promise(res => {
            if (!fmt.min)
                return res()
            const img = new Image()
            img.onerror = () => res()
            img.onload = () => { formats.push(fmt); res() }
            img.src = fmt.min
        })))
        return formats
    }
    async function getSupportedImageOutFormats() {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const formats = []
        for (const fmt of imageFormats) {
            for (const mi of fmt.mime) {
                const dataURL = canvas.toDataURL(mi)
                if (fmt.mime.some(m => dataURL.startsWith(`data:${m}`))) {
                    formats.push(fmt)
                    break
                }
            }
        }
        return formats
    }
    async function getSupportedAudioInFormats() {
        const audioContext = new AudioContext()
        const formats = []
    
        await Promise.all(audioFormats.map(format => (async () => {
            if (!format.min)
                return
            const buffer = base64ToBuffer(format.min)
            try {
                await audioContext.decodeAudioData(buffer)
                formats.push(format)
            } catch { }
        })()))
    
        return formats
    }

    const promises = []
    promises.push((async () => 
        supportedImageInFormats = await getSupportedImageInFormats()
    )())
    promises.push((async () => 
        supportedImageOutFormats = await getSupportedImageOutFormats()
    )())
    promises.push((async () => 
        supportedAudioInFormats = await getSupportedAudioInFormats()
    )())
    await Promise.all(promises)

    console.log(`Supported Image.src = ...: ${supportedImageInFormats.map(x => x.name).join(', ')}`)
    console.log(`Supported Canvas.toDataURL(): ${supportedImageOutFormats.map(x => x.name).join(', ')}`)
    console.log(`Supported AudioContext.decodeAudioData(...): ${supportedAudioInFormats.map(x => x.name).join(', ')}`)

    await Promise.all(Object.values(formats).map(format => format?.init?.()))
}

/**
 * @param {ArrayBuffer} buffer 
 * @param {{mimeType?: string, mustSupportEncoding?: boolean, mustSupportDecoding?: boolean}} [options] 
 * @returns {Promise<any[]>}
*/
export async function assumeFormats(buffer, options) {
    const mime = options?.mimeType
    const mustSupportEncoding = options?.mustSupportEncoding ?? false
    const mustSupportDecoding = options?.mustSupportDecoding ?? false

    const outFormats = []

    await Promise.all(Object.values(formats).map(format => (async () => {
        if (format.assumeBySignature) {
            if (!await format.assumeBySignature(buffer))
                return
            if ((mime != null) && !format.mime.includes(mime))
                return
        }
        else if (mime == null)
            return
        else if (!format.mime.includes(mime))
            return
        if (mustSupportEncoding && (!format.encodingSupported || !await format.encodingSupported()))
            return
        if (mustSupportDecoding && (!format.decodingSupported || !await format.decodingSupported()))
            return
        outFormats.push(format)
    })()))

    return outFormats
}

export async function getEncodableFormats() {
    const formatsOut = []
    await Promise.all(Object.values(formats).map(format => (async () => {
        if (!format.encodingSupported || !await format.encodingSupported())
            return
        formatsOut.push(format)
    })()))
    return formatsOut
}
export async function getDecodableFormats() {
    const formatsOut = []
    await Promise.all(Object.values(formats).map(format => (async () => {
        if (!format.decodingSupported || !await format.decodingSupported())
            return
        formatsOut.push(format)
    })()))
    return formatsOut
}


const declip = {
    none(sample) { return sample },
    clamp(sample) { return $clamp(sample, -1, 1) },
    tanh(sample) { return Math.tanh(sample) }
}


function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}

//


// bitDepth [int8, int16, int24, int32, float32] (float32)
// numberOfChannels (2)
// sampleRate [4000, 8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 176400, 192000] (48000)
//
// если было 2+ каналов, а станет 1:
//    Mono Channel Data: Average / i-th Channel
//    если выбрано I-th Channel:
//       Channel Index: number
// если кол-во станет больше:
//    Excess Channel Data: Silence / Modulo
// Clip Mode: Overflow, Clamp, Tanh

/**
 * @param {AudioBuffer} audioBuffer 
 * @param {{bitDepth?: 'int8'|'int16'|'int24'|'int32'|'float32', numberOfChannels?: number, sampleRate?: number, }} [options] 
 * @returns {ArrayBuffer}
*/
function audio2wav(audioBuffer, options) {
    const formats = {
        int8:    [true, 8, DataView.prototype.setInt8],
        int16:   [true, 16, DataView.prototype.setInt16],
        int24:   [true, 24, (function (byteOffset, value, littleEndian = false) {
            if (value > 8388607) value = 8388607
            if (value < -8388608) value = -8388608

            if (littleEndian) {
                this.setUint8(byteOffset, value & 0xFF)
                this.setUint8(byteOffset + 1, (value >> 8) & 0xFF)
                this.setUint8(byteOffset + 2, (value >> 16) & 0xFF)
            } else {
                this.setUint8(byteOffset, (value >> 16) & 0xFF)
                this.setUint8(byteOffset + 1, (value >> 8) & 0xFF)
                this.setUint8(byteOffset + 2, value & 0xFF)
            }
        })],
        int32:   [true, 32, DataView.prototype.setInt32],
        float32: [false, 32, DataView.prototype.setFloat32],
    }
    const format = formats[options?.bitDepth ?? 'int32']
    if (!format)
        throw `Unsupported WAV bit depth: '${options.bitDepth}'`
    
    const numberOfChannels = options?.numberOfChannels ?? audioBuffer.numberOfChannels
    const sampleRate = options?.sampleRate ?? audioBuffer.sampleRate
    const channelLength = Math.ceil(audioBuffer.length / audioBuffer.sampleRate * sampleRate)
    const bitsPerSample = format[1]

    const bytesPerSample = bitsPerSample / 8
  
    var buffer = new ArrayBuffer(44 + channelLength * numberOfChannels * bytesPerSample)
    var view = new DataView(buffer)
  
    // WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + channelLength * numberOfChannels * bytesPerSample, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, format[0] ? 1 : 3, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true) // byte rate
    view.setUint16(32, numberOfChannels * bytesPerSample, true) // block align
    view.setUint16(34, bitsPerSample, true)
    writeString(view, 36, 'data')
    view.setUint32(40, channelLength * numberOfChannels * bytesPerSample, true)
  
    const channels = Array(audioBuffer.numberOfChannels).fill(0).map((_, i) => audioBuffer.getChannelData(i))

    const mult = format[0] ? (2 ** bitsPerSample / 2 - 1) : 1
    const func = format[2].bind(view)
    
    let offset = 44
    for (let i = 0; i < channelLength; ++i)
        for (let channel = 0; channel < numberOfChannels; ++channel) {
            const c_ = channel % audioBuffer.numberOfChannels
            const i_ = i / channelLength * audioBuffer.length
            const sample1 = channels[c_][Math.floor(i_)]
            const sample2 = channels[c_][Math.ceil(i_)]
            //let sample = (sample1 + sample2) / 2
            const mult = i_ % 1
            let sample = sample1 * (1 - mult) + sample2 * mult
            if (format[2]) {
                if (sample > 1) sample = 1
                if (sample < -1) sample = -1
            }
            func(offset, sample * mult, true)
            offset += bytesPerSample
        }
    
    return buffer
}
function image2bmp(img) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)

    const width = imageData.width
    const height = imageData.height

    // Create a new ImageData object to hold the pixel data
    const data = imageData.data

    // BMP file header
    const fileSize = 54 + data.length // BMP file size
    const buffer = new ArrayBuffer(fileSize)
    const view = new DataView(buffer)

    // BMP file header
    view.setUint8(0, 0x42) // "B"
    view.setUint8(1, 0x4d) // "M"
    view.setUint32(2, fileSize, true) // File size
    view.setUint32(10, 54, true) // Offset to pixel data

    // BMP DIB header
    view.setUint32(14, 40, true) // DIB header size
    view.setInt32(18, width, true) // Image width
    view.setInt32(22, -height, true) // Image height (negative to flip vertically)
    view.setUint16(26, 1, true) // Number of color planes
    view.setUint16(28, 32, true) // Bits per pixel
    view.setUint32(30, 0, true) // Compression method (0 = none)
    view.setUint32(34, data.length, true) // Image size (including padding)
    view.setInt32(38, 2835, true) // Horizontal resolution (pixels per meter, 72 dpi)
    view.setInt32(42, 2835, true) // Vertical resolution (pixels per meter, 72 dpi)
    view.setUint32(46, 0, true) // Number of colors in the palette
    view.setUint32(50, 0, true) // Number of important colors

    let offset = 54 // Pixel data offset
    for (let i = 0; i < data.length; i += 4) {
        view.setUint8(offset + i + 2, data[i])     // B
        view.setUint8(offset + i + 1, data[i + 1]) // G
        view.setUint8(offset + i, data[i + 2])     // R
        view.setUint8(offset + i + 3, 255)         // A
    }

    return new Blob([buffer], { type: 'image/bmp' })
}

// 1 Файл перекинут
// 2 Файл добавлен в очередь конвертации
// 3 Для каждого файла из очереди:
// 4 Определить тип по сигнатуре. Иногда это невозможно - тогда сравнить mime-type
// 5 Если тип не распознан, пошёл юзер нахуй
// 6 Проверка: поддерживается ли конвертация в dstFmt
// 7 Если не поддерживается, пошёл юзер нахуй
// 8 Вызов конвертации