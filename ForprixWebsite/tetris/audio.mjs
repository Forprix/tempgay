
const buffers = {}
const playbacks = []

class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.port.onmessage = e => {
            const json = e.data.buffer
            switch (json.op) {
                case 'upload':
                    buffers[json.name] = { data: json.data, sampleRate: json.sampleRate }
                    break
                case 'play':
                    playbacks.push({
                        pos: json.pos ?? 0,
                        name: json.name,
                        pitch: json.pitch ?? 1
                    })
                    break
            }
            // this.buffers = e.data.buffer
            // console.log(e.data.buffer)
        }
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0]

        for (let c = 0; c < output.length; ++c) {
            const outputChannel = output[c]
            if (!outputChannel) continue
            for (let i = 0; i < outputChannel.length; ++i) {
                let ss = 0
                for (let pi = 0; pi < playbacks.length; ++pi) {
                    const p = playbacks[pi]
                    const buf = buffers[p.name]
                    const mc = c % buf.data.length
                    const arrBuf = buf.data[mc]
                    const i = p.pos * buf.sampleRate
                    const i1 = Math.floor(i)
                    const i2 = Math.ceil(i)
                    if (i2 >= arrBuf.length) {
                        playbacks.splice(pi, 1)
                        --pi
                        continue
                    }
                    const h = i - i1
                    const s1 = arrBuf[i1]
                    const s2 = arrBuf[i2]
                    const s = s1 + (s2 - s1) * h
                    ss += s

                    if (c == 0) p.pos += 1 / sampleRate * p.pitch
                }
                outputChannel[i] = ss
            }
        }

        return true
    }
}
  
registerProcessor("audio", MyAudioProcessor)