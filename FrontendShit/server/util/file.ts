// @ts-nocheck

import fsa from 'node:fs/promises'
import fs from 'node:fs'
import _path from 'node:path'


export async function fileExists(path: string) {
    return fs.existsSync(path) && (await fsa.stat(path)).isFile()
}
export async function write(
    path: string,
    content: Parameters<typeof import('node:fs/promises').writeFile>[1]
) {
    const dir = _path.dirname(path)
    await fsa.mkdir(dir, { recursive: true })
    await fsa.writeFile(path, content)
}
export async function copy(
    srcPath: string,
    dstPath: string
) {
    const dir = _path.dirname(dstPath)
    await fsa.mkdir(dir, { recursive: true })
    await fsa.copyFile(srcPath, dstPath)
}
export async function remove(path: string) {
    const dir = _path.dirname(path)
    await fsa.mkdir(dir, { recursive: true })
    await fsa.unlink(path)
    while (true) {
        path = _path.dirname(path)
        if ((await fsa.readdir(path)).length === 0)
            await fsa.rmdir(path)
        else
            break
    }
}
export async function walkFiles(dir, cb) {
    const promises = []
    for (const f of await fsa.readdir(dir)) {
        const fullPath = _path.join(dir, f)
        const stat = await fsa.stat(fullPath)
        if (stat.isDirectory()) promises.push(walkFiles(fullPath, cb))
        if (stat.isFile()) promises.push(cb(fullPath, stat))
    }
    await Promise.all(promises)
}
export async function listFiles(dir) {
    const files = []
    await walkFiles(dir, path => files.push(path))
    return files.map(normalize)
}
export async function clear(dir) {
    if (fs.existsSync(dir))
        await fsa.rm(dir, { recursive: true })
    await fsa.mkdir(dir)
}
export async function read(path) {
    return (await fsa.readFile(path)) + ''
}
export function normalize(path : string) {
    // Так же сделать './'
    let p = _path.normalize(path).replace(/[\\\/]/g, '/')
    if (p[0] != '/' && p[0] != '.')
        p = './' + p
    return p
}
export function path(...paths : string[]) {
    return normalize(_path.join(...paths))
}
export function name(path : string) {
    return _path.basename(path)
}
export function dirname(path : string) {
    return normalize(_path.dirname(path))
}
export function relative(from : string, to : string) {
    return normalize(_path.relative(from, to))
}
// relative, dirname, basename