const flac   = (await import('./flac-decoder.js')).default['flac-decoder'].FLACDecoder
const mpg123 = (await import('./mpg123-decoder.js')).default['mpg123-decoder'].MPEGDecoder
const opus   = (await import('./ogg-opus-decoder.js')).default['ogg-opus-decoder'].OggOpusDecoder
const vorbis = (await import('./ogg-vorbis-decoder.js')).default['ogg-vorbis-decoder'].OggVorbisDecoder

// const decoder = SomeDecoder()
// const bytes = await decoder.decode(bytes)
// decoder.finish()



// const lox = (await import('./wav-decoder.js')).default

// await import('./flac-decoder.min.js')
// await import('./ogg-opus-decoder.min.js')
// await import('./ogg-vorbis-decoder.min.js')

// const mp3Decoder = new window['mpg123-decoder'].MPEGDecoder()
// await mp3Decoder.ready

// const reader = (await fetch('Holding On To Smoke.mp3')).body.getReader()

// const bufs = []

// while (true) {
//     const chunk = await reader.read()
//     if (chunk.done) break
//     bufs.push(await mp3Decoder.decode(chunk.value))
//     break
// }

// const audioCtx = new AudioContext()

// function createAudioBufferFromChannels(leftData, rightData, sampleRate) {
//     const buffer = audioCtx.createBuffer(2, leftData.length, sampleRate)
//     buffer.getChannelData(0).set(leftData)
//     buffer.getChannelData(1).set(rightData)
//     console.log(buffer)
//     return buffer
// }

// const source = audioCtx.createBufferSource()
// source.buffer = createAudioBufferFromChannels(bufs[0].channelData[0], bufs[0].channelData[1], bufs[0].sampleRate)
// source.connect(audioCtx.destination)
// source.start()
