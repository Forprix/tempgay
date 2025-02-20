import { parser as parser_, first, SIZE, IDX, TYPE, CHILDREN, xyecocLogs } from './parser.js'
import { treeify } from "./forprolivod.js"

const names = []
const SYM_PRS = Symbol()
const bank = new Map
const parser = (a, n) => {
    if (a[SYM_PRS]) return a
    let v
    if (typeof a == 'string')
        v = bank.get(a) ?? ((s, i) => bank.get(a)(s, i))
    else if (a instanceof RegExp) {
        n ??= `#rgx\0${a.source}\0${a.flags}`
        v = parser_((s, data) => {
            const m = s.match(new RegExp('^(?:' + data[0] + ')', data[1]))
            if (m == null) return
            m[TYPE] = [n]
            m[SIZE] = m[0].length
            m[IDX] = s.i
            return m
        }, n, [a.source, a.flags])
        if (n != null) bank.set(n, v)
    }
    else {
        v = parser_(a, n)
        if (n != null) bank.set(n, v)
    }
    names.push(n)
    v[SYM_PRS] = true
    return v
}
let i = 0
const [mod, seq, or, many, sep, man, and, not] = (() => {
    const psst = () => ({})
    
    const man = (n1, n2, p) => {
        n1 ??= `#man${++i}`
        n2 ??= `#man`
        return parser(s => {
            const r = p(s)
            if (r != null) {
                r[IDX] ??= s.i
                r[TYPE] ??= [n2]
            }
            return r
        }, n1)
    }
    const mod = (n1, n2, cb, p) => {
        n1 ??= `#mod${++i}`
        n2 ??= `#mod`
        cb ??= psst
        p = parser(p)
        return parser(s => {
            const m = p(s)
            if (m == null) return
            const r = cb(m)
            if (r == m) return r
            if (r != null) {
                r[SIZE] ??= m[SIZE]
                r[IDX] ??= s.i
                r[CHILDREN] ??= [m]
                r[TYPE] ??= [n2]
                return r
            }
        }, n1)
    }
    const seq = (n1, n2, cb, ...ps) => {
        n1 ??= `#seq${++i}`
        n2 ??= `#seq`
        cb ??= psst
        ps = ps.map(x => parser(x))
        return parser(s => {
            let l = s.i
            const arr = []
            for (let i = 0; i < ps.length; ++i) {
                const m = ps[i](s, l)
                if (m == null) return
                arr.push(m)
                if (m[SIZE] == null) throw new Error('NIGGER 1!!!')
                l += m[SIZE]
            }
            const r = cb(arr, l - s.i)
            if (r != null) {
                r[SIZE] ??= l - s.i
                r[IDX] ??= s.i
                r[CHILDREN] ??= arr
                r[TYPE] ??= [n2]
            }
            return r
        }, n1)
    }
    const or = (n1, n2, cb, ...ps) => {
        n1 ??= `#or${++i}`
        n2 ??= `#or`
        cb ??= x => {
            if (x[TYPE][0] != n2) x[TYPE].unshift(n2)
            return x
        }
        ps = ps.map(x => parser(x))
        return parser(s => {
            for (const p of ps) {
                const m = p(s)
                if (m != null) {
                    const r = cb(m)
                    if (r != null) {
                        r[SIZE] ??= m[SIZE]
                        r[IDX] ??= s.i
                        r[CHILDREN] ??= [m]
                        r[TYPE] ??= [n2, ...m[TYPE]]
                        return r
                    }
                }
            }
        }, n1)
    }
    const many = (n1, n2, cb, p, atLeast = 0) => {
        n1 ??= `#many`
        n2 ??= `#many${++i}`
        cb ??= psst
        p = parser(p)
        return parser(s => {
            let l = s.i
            const arr = []
            while (true) { // Этот цикл выполняется дохуище раз
                const m = p(s, l)
                if (m == null) break
                arr.push(m)
                if (m[SIZE] == null) throw new Error('NIGGER 2!!!')
                l += m[SIZE]
            }
            if (arr.length < atLeast) return
            const r = cb(arr, l - s.i)
            if (r != null) {
                r[SIZE] ??= l - s.i
                r[IDX] ??= s.i
                r[CHILDREN] ??= arr
                r[TYPE] ??= [n2]
            }
            return r
        }, n1)
    }
    const sep = (n1, n2, cb, p, sp, atLeast = 0) => {
        n1 ??= `#sep${++i}`
        n2 ??= `#sep`
        cb ??= psst
        p = parser(p)
        sp = parser(sp)
        return parser(s => {
            let l = s.i
            let f = true
            const all = [], fill = [], sep = []
            while (true) {
                let j = l
                let m1, m2
                if (f) f = false
                else {
                    m1 = sp(s, j)
                    if (m1 == null) break
                    j += m1[SIZE]
                }
                m2 = p(s, j)
                if (m2 == null) break
                if (m1 != null) {
                    sep.push(m1)
                    all.push(m1)
                }
                fill.push(m2)
                all.push(m2)
                j += m2[SIZE]
                l = j
            }
            if (all.length < atLeast) return

            const r = cb({all, fill, sep}, l - s.i)
            if (r != null) {
                r[SIZE] ??= l - s.i
                r[IDX] ??= s.i
                r[CHILDREN] ??= all
                r[TYPE] ??= [n2]
            }
            return r
        }, n1)
    }
    const and = (n1, n2, cb, ...ps) => {
        n1 ??= `#and${++i}`
        n2 ??= `#and`
        cb ??= psst
        ps = ps.map(x => parser(x))
        return parser(s => {
            let maxSize = 0
            const arr = []
            for (let i = 0; i < ps.length; ++i) {
                const m = ps[i](s, s.i)
                if (m == null) return
                arr.push(m)
                if (m[SIZE] == null) throw new Error('NIGGER 1!!!')
                maxSize = Math.max(maxSize, m[SIZE])
            }
            const r = cb(arr, maxSize)
            if (r != null) {
                r[SIZE] ??= maxSize
                r[IDX] ??= s.i
                r[CHILDREN] ??= arr
                r[TYPE] ??= [n2]
            }
            return r
        }, n1)
    }
    const not = (n1, n2, cb, p) => {
        n1 ??= `#not${++i}`
        n2 ??= `#not`
        cb ??= psst
        p = parser(p)
        return parser(s => {
            const m = p(s)
            if (m != null) return
            const r = cb()
            if (r != null) {
                r[SIZE] ??= 0
                r[IDX] ??= s.i
                r[CHILDREN] ??= []
                r[TYPE] ??= [n2]
                return r
            }
        }, n1)
    }
    return [mod, seq, or, many, sep, man, and, not].map(x => 
        (bankId, astId) => (astId ??= bankId, (...rules) => transformer => x(bankId, astId, transformer, ...rules))
    )
})()







or('call')(
    seq()('id', /\(\s*/, sep('args')('expression', /\s*\,\s*/)(),     /\s*\)/)(),
    seq()('id', /\s+/,   sep('args')('expression', /\s*\,\s*/,  1)()  )()
)()

or('literal')('number', 'boolean', 'string', 'null')()
mod('null')(/nul/)()
seq('string')(/\'/, /[^\']*/, /\'/)(x => ({ value: x[1][0] }))
mod('boolean')(/yes|no/)(x => ({ value: x[0] == 'yes' }))



// // 1. reduce #parsers
// // 2. array-like ids ['expression', 'literal', 'number']



or('number')(
    mod('scientific')(/[0-9]+(?:\.[0-9]+)?[eE][-+]?[0-9]+/)(x => {
        const [n, e] = x[0].split(/[eE]/)
        let p = n.indexOf('.')
        let s = p == -1 ? n : (n.slice(0, p) + n.slice(p + 1))
        p = +e + (p == -1 ? s.length : p)
        if (p <= 0)
            s = '0.' + Array(-p).fill('0').join('') + s
        else if (p < s.length)
            s = s.slice(0, p).replace(/^0+/, '0') + '.' + s.slice(p)
        else {
            if (p > s.length)
                s += Array(p - s.length).fill('0').join('')
            s = s.replace(/^0+/, '')
        }
        const value = s || '0'
        return {value }
    }),
    mod('hexadecimal')(/0x[0-9a-fA-F]+/)      (x => ({ value: BigInt(x[0]) + '' })),
    mod('binary')     (/0b[01]+/)             (x => ({ value: BigInt(x[0]) + '' })),
    mod('decimal')    (/[0-9]+(?:\.[0-9]+)?/) (x => ({ value: BigInt(x[0]) + '' }))
)()

seq('binaryOperation')('expression', /\s*/, /[%&^*/+-]/, /\s*/, 'expression')(x => ({ operation: x[2][0] }))
seq('prefixOperation')(/[%&^*/+-]/, 'expression2')(x => ({ operation: x[0][0] }))

or('expression2', 'expression')('call', 'brackets', 'prefixOperation', 'literal', 'id')()
or('expression')('binaryOperation', 'expression2')()

seq('brackets')(/\(/, 'expression', /\)/)()
and('id')(
    /[$_\p{ID_Start}](?:[$\u200c\u200d\p{ID_Continue}\-]*[$\u200c\u200d\p{ID_Continue}])?/u,
    not()(/ret|skip|die|do|end|if|yes|no|nul|else|elif|fn|loop|while|reach|for/)()
)(x => ({ value: x[0][0] }))

seq('variableAssignment')('id', /\s*=\s*/, 'expression')()
or('statement')('variableAssignment', 'call')()
sep('statements')('statement', /\s+/)()
seq('toplevel')(/\s*/, 'statements', /\s*/)()

function printAST(ast, msg = [], depth = 0, loxs = new Set) {
    if (loxs.has(ast)) return
    if (!(TYPE in ast)) return
    loxs.add(ast)
    let dauns = []
    for (const k in ast) {
        if (k != TYPE && k != IDX && k != TYPE && k != CHILDREN && k != SIZE && typeof k === 'string')
            dauns.push(k)
    }
    const chl = (ast[CHILDREN] ?? [])
    const adequateTypes = ast[TYPE].filter(x => x[0] != '#')
    const skip = adequateTypes.length == 0
    if (!skip) {
        const xyecoc = dauns.map(x => `\x1b[90m${x}\x1b[m: \x1b[34m${JSON.stringify(ast[x])}\x1b[m`).join(', ')
        msg.push(' '.repeat(depth) + '\x1b[32;1m▅ ' + adequateTypes.map((x, i, a) => (i == a.length - 1 ? '\x1b[;92m' : '\x1b[;90m') + x).join('\x1b[;m.') + '\x1b[m' + (xyecoc ? `(${xyecoc})` : ''))
    }
    for (const v of chl)
        printAST(v, msg, depth + (skip ? 0 : 1), loxs)
    loxs.delete(ast)
    return msg
}


const code = `a(a(a(a(a(a())))))`

const ast = bank.get('toplevel')(first(code, null, names))

// console.log(JSON.stringify(ast, null, 2))
// operation tree

console.log(JSON.stringify(ast))

function toJS(ast) {
    switch (ast[TYPE]) {
        case 'toplevel':
            return toJS(ast[CHILDREN][1])
        case 'statement':
        case 'expression':
        case 'call':
        case 'expressionButNotBinaryOperation':
        case 'literal':
            return toJS(ast[CHILDREN][0])
        case 'statements':
            return ast[CHILDREN].map(toJS).filter(x => x).join(';')
        case 'args':
            return ast[CHILDREN].map(toJS).filter(x => x).join(',')
        case 'variableAssignment':
            return `let ${toJS(ast[CHILDREN][0])}=${toJS(ast[CHILDREN][2])}`
        case 'binaryOperation':
            return `${toJS(ast[CHILDREN][0])}${ast[CHILDREN][2][0]}${toJS(ast[CHILDREN][4])}`
        case 'prefixOperation':
            return `${ast[CHILDREN][0][0]}${toJS(ast[CHILDREN][1])}`
        case 'boolean':
            return ast.value ? 'true' : 'false'
        case 'bracketedCall':
            return `${toJS(ast[CHILDREN][0])}(${toJS(ast[CHILDREN][2])})`
        case 'bracketlessCall':
            return `${toJS(ast[CHILDREN][0])}(${toJS(ast[CHILDREN][2])})`
        case 'id':
            return ast.value
        case 'number':
            return ast.value
        case 'string':
            return `'${ast.value}'`
        
    }
    return null
}
console.log('\x1b[;1mSource Code\x1b[;m')
console.log(code)
console.log('\n\x1b[;1mParse Stack')
console.log(treeify(xyecocLogs).join('\n'))
console.log('\n\x1b[;1mSyntax Tree')
console.log(treeify(printAST(ast) ?? ["Couldn't parse"]).join('\n'))

// 1. str2ast(str)  СДЕЛАНО
// 2. ast2ot(ast)   НЕ СДЕЛАНО
// 3. reduceOt(ot)  НЕ СДЕЛАНО
// 4. ot2js(ot)     СДЕЛАНО