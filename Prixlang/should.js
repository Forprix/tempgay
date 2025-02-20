or ('call')(
    seq()('id', /\(\s*/, sep('args')('expression', /\s*\,\s*/), /\s*\)/)(),
    seq()('id', /\s+/,   sep('args')('expression', /\s*\,\s*/, 1))()
)()
or ('literal')('number', 'boolean', 'string', 'null')()
seq('null')   (/nul/)()
seq('string') (/\'/, /[^\']*/, /\'/) (x => ({ value: x[1][0] }))
seq('boolean')(/yes|no/)             (x => ({ value: x[0] == 'yes' }))
seq('boolean')(/yes|no/)             (x => ({ value: x[0] == 'yes' }))
or ('number')(
    seq('scientific')(/[0-9]+(?:\.[0-9]+)?[eE][-+]?[0-9]+/)(x => {
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
    seq('hexadecimal')(/0x[0-9a-fA-F]+/)     (x => ({ value: BigInt(x[0]) + '' })),
    seq('binary')     (/0b[01]+/)            (x => ({ value: BigInt(x[0]) + '' })),
    seq('decimal')    (/[0-9]+(?:\.[0-9]+)?/)(x => ({ value: BigInt(x[0]) + '' }))
)()
seq('binaryOperation')('expression', /\s*/, /[%&^*/+-]/, /\s*/, 'expression')(x => ({ operation: x[2][0] }))
seq('prefixOperation')(/[%&^*/+-]/, '_expr')(x => ({ operation: x[0][0] }))

or ('_expr', 'expression')('brackets', 'prefixOperation', 'literal', 'id')()
or ('expression')         ('binaryOperation', '_expr')()

seq('brackets')(/\(/, 'expression', /\)/)()
and('id')(
    /[$_\p{ID_Start}](?:[$\u200c\u200d\p{ID_Continue}\-]*[$\u200c\u200d\p{ID_Continue}])?/u,
    not(null, /ret|skip|die|do|end|if|yes|no|nul|else|elif|fn|loop|while|reach|for/)
)(x => ({ value: x[0][0] }))

seq('variableAssignment') ('id', /\s*=\s*/, 'expression')()
or ('statement')          ('variableAssignment', 'call')()
sep('statements')         ('statement', /\s+/)()
seq('toplevel')           (/\s*/, 'statements', /\s*/)()

