export const SIZE = '_size'
export const IDX = '_index'
export const TYPE = '_type'
export const CHILDREN = '_children'

function ParseRequest(ref, i, i0, id, id0, d, set, cache) {
    this.ref = ref
    this.i = i
    this.i0 = i0
    this.id = id
    this.id0 = id0
    this.d = d
    this.set = set
    this.cache = cache
}
ParseRequest.prototype = {
    match(...args) {
        return this.ref.str.slice(this.i).match(...args)
    },
    substr(i1, i2) {
        if (i2 == null) return this.ref.str.substr(this.i + i1)
        return this.ref.str.substr(this.i + i1, i2)
    },
    offset(i) {
        return new ParseRequest(
            this.ref,
            this.i + i,
            this.i0,
            this.id,
            this.id0,
            this.set,
            this.cache
        )
    },
    get length() {
        return this.ref.str.length
    }
}


const logs = []
export const xyecocLogs = []

export function first(s, id, names) {
    return new ParseRequest({str: s}, 0, 0, id, undefined, 0, new Set, new Map(names.map(x => [x, new Map])))
}

// set, cache
export function parser(f, currentId, data) {
    return (s, currentIdx) => {
        currentIdx ??= s.i
        const { d: depth, ref, set, cache, i: parentIdx, id: parentId } = s
        const log = [depth, parentIdx, currentIdx, parentId, currentId, null]

        const recursionKey = [parentIdx, currentIdx, parentId, currentId].join(' ')
        if (set.has(recursionKey)) return (log[5] = '\x1b[1;35m▅\x1b[;m', null)

        logs.push(log)

        const cachedParsingResultsOfId = cache.get(currentId)
        const cachedParsingResult = cachedParsingResultsOfId.get(currentIdx)
        if (cachedParsingResult != null) return (log[5] = '\x1b[1;34m▅\x1b[;m', cachedParsingResult)

        set.add(recursionKey)
        const r = f(new ParseRequest(ref, currentIdx, parentIdx, currentId, parentId, depth + 1, set, cache), data)
        set.delete(recursionKey)
        cachedParsingResultsOfId.set(currentIdx, r)
        // console.log(id, i)

        log[5] = r == null ? '\x1b[1;31m▅\x1b[;m' : '\x1b[1;32m▅\x1b[;m'

        if (depth == 0)
            for (const l of logs) {
                // console.log(Array(l[0]).fill(' ').join('') + `${l[3]}(${l[1]}).${l[4]}(${l[2]}): ${l[5]}`)
                xyecocLogs.push(' '.repeat(l[0]) + `${l[5]} ${l[4]} ${(l[3] == null || l[2] != l[1]) ? `\x1b[1m${l[2]}\x1b[;m` : ''}`)
            }

        return r
    }
}