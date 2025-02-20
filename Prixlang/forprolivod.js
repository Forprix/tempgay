export function toTree(data) {
    const root = [], stack = [[-1, root]]
    for (const line of data) {
        const level = line.search(/\S/), node = [line.trim(), []]
        while (stack.at(-1)[0] >= level) stack.pop()
        stack.at(-1)[1].push(node)
        stack.push([level, node[1]])
    }
    return root
}
export function treeToString(tree, prefix = '', isRoot = true, lines = []) {
    tree.forEach((v, i) => {
        const isLast = i === tree.length - 1
        lines.push(prefix + (isRoot ? '' : isLast ? '\x1b[90;1m┗━\x1b[;m' : '\x1b[90;1m┣━\x1b[;m') + v[0])
        v[1]?.length && treeToString(v[1], prefix + (isRoot ? '' : isLast ? '  ' : '\x1b[90;1m┃ \x1b[;m'), false, lines)
    })
    return lines
}

export function treeify(arr) {
    return treeToString(toTree(arr))
}