// @ts-nocheck

import { deflate, undeflate } from './shared-util.js'
import { program } from './serializer.js'

export default function (currentSide, configurer) {
    const me = {}

    let rcvIdDrlz, rcvIdSize, sndIdSrlz
    me.inMessageNames = []
    me.outMessageNames = []
    
    me.deserialize = async (arr) => {
        const id = rcvIdDrlz(arr)
        const [_, name, desers, cmpr] = rcvCfg.find(x => x[0] == id)
        let sarr = arr.subarray(rcvIdSize)
        if (cmpr) sarr = await undeflate(sarr)
        let pos = 0
        const args = []
        for (const deser of desers) pos += deser(sarr.subarray(pos), args)
        return [name, ...args]
    }
    me.serialize = async (name, ...args) => {
        const r = sndCfg.find(x => x[1] == name)
        if (!r) throw new Error(`Provided online message name is unknown: ${name}`)
        const [id, _, sers, cmpr] = r
        const arr = []
        for (let i = 0; i < sers.length; ++i)
            sers[i](arr, args[i])
        let toSend = sndIdSrlz(id)
        if (arr.length > 0) {
            let i = arr.length - 1
            for (; i >= 0 && arr[i] == 0; --i);
            if (i != arr.length - 1) arr.splice(i + 1)
        }
        if (cmpr) toSend.push(...await deflate(new Uint8Array(arr)))
        else toSend.push(...arr)
        return new Uint8Array(toSend)
    }

    let rcvCfg = [], sndCfg = []
    let ci = 0, si = 0
    const a = {
        define(cfg, ...types) {
            let name = cfg?.name ?? cfg
            let compress = cfg?.compress ?? false
            rcvCfg.push([ci++, name, types.map(x => program(x)[1]), compress])
        }
    }
    const b = {
        define(cfg, ...types) {
            let name = cfg?.name ?? cfg
            let compress = cfg?.compress ?? false
            sndCfg.push([si++, name, types.map(x => program(x)[0]), compress])
        }
    }
    if (currentSide == 'client') configurer(a, b)
    else if (currentSide == 'server') configurer(b, a)
    const rcvMsgs = rcvCfg.map(x => x[1])
    rcvIdDrlz = rcvMsgs.length < 256 ? x => x[0] : x => x[0] + x[1] * 256
    rcvIdSize = rcvMsgs.length < 256 ? 1 : 2
    me.inMessageNames = rcvMsgs

    const sndMsgs = sndCfg.map(x => x[1])
    sndIdSrlz = sndMsgs.length < 256 ? x => [x] : x => [x % 256, Math.floor(x / 256)]
    me.outMessageNames = sndMsgs

    return me

}