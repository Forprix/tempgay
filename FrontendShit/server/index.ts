// @ts-nocheck

import Express from 'express'
import { sleep, loop, floor, SmartMap, SmartSet, Elapser } from './util.ts'
import { hsv2rgb } from '../shared/color.ts'
import * as Chokidar from 'chokidar'
import ChildProcess from 'node:child_process'
import Process from 'node:process'
import Path from 'node:path'
import AutoPrefixer from 'autoprefixer'
import Stylus from 'stylus'
import CleanCSS from 'clean-css'
import PostCSS from 'postcss'
import { WebSocketServer } from 'ws'
import * as NodeHTMLParser from 'node-html-parser'
import * as SWC from '@swc/core'
import ErrorStackParser from 'error-stack-parser'
import { SourceMapConsumer } from 'source-map-js'
import { detect } from './detect-browser.js'

// как реализовать бандлинг:
// все импорты файлов за пределами client клонируются в build и переименовываются
// + резолвятся имена с помощью package.json

import * as file from './util/file.ts'
import s from "https://cdn.jsdelivr.net/npm/lodash.rest@4.0.5/+esm";


const devMode = true

const pkg = JSON.parse(await file.read('./package.json'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }

await file.clear('build')

function wsBroadcast(...args) {
    // console.log('Broadcasted')
    for (const c of allClients) c.send(...args)
}
const allClients = new Set
const ws = new WebSocketServer({ port: 3000 })
    .on('connection', wsClient => {
        // console.log('New client')
        wsClient.on('message', async e => {
            try {
                const d = JSON.parse(`${e}`)
                const stackFrames = ErrorStackParser.parse({ name: d.errorName, stack: d.errorStack })
                const client = detect(d.userAgent)
                const lines = []
                lines.push(`\x1b[1;31m${d.errorName} \x1b[;31min \x1b[1;31m${client.name} ${client.version}\x1b[;31m on \x1b[1;31m${client.os}`)
                for (const s of stackFrames) {
                    const p = file.path('build', new URL(s.fileName).pathname)
                    let mapPath
                    for (const [k, v] of associatedFiles) {
                        if (v.has(p)) {
                            mapPath = [...v].find(x => x.endsWith('.js.map'))
                            break
                        }
                    }
                    if (mapPath != null) {
                        const pos = new SourceMapConsumer(JSON.parse(await file.read(mapPath))).originalPositionFor({
                            line: s.lineNumber,
                            column: s.columnNumber
                        })
                        lines.push(`\x1b[m    \x1b[;4;31m${file.normalize(pos.source)}:${pos.line}:${pos.column}\x1b[m`)
                    }
                    else {
                        
                        lines.push(`\x1b[m    \x1b[;4;31m${p}:${s.lineNumber}:${s.columnNumber}\x1b[m`)
                    }
                }
                if (d.errorMessage != null) {
                    lines.push(`\x1b[;1;31mMessage: \x1b[;31m${d.errorMessage}\x1b[m`)
                }
                console.log(lines.join('\n'))
            } catch (e) {
                console.log(`\x1b[1;31mOops! Something really bad happened:\x1b[;31m`, e, '\x1b[m')
            } 
            
        })
        allClients.add(wsClient)
        wsClient.on('close', () => allClients.delete(wsClient))
    })


const compilers = [
    async ctx => {
        if (!ctx.path.endsWith('.eval.js')) return false
        let s = ''
        await new Promise(res => {
            const cp = ChildProcess.exec(`node "${ctx.filename}"`, { cwd: file.path(ctx.src, ctx.dir) })
            cp.stdout.on('data', data => { s += data })
            cp.stderr.on('data', data => { Process.stderr.write(data) })
            cp.on('close', () => res())
        })
        ctx.write(ctx.path.replace(/\.eval\.js$/, ''), s)
    },
    async ctx => {
        if (!ctx.path.endsWith('.styl')) return false
        const original = await ctx.read()
        let r
        try {
            r = new CleanCSS()
                .minify((await PostCSS([AutoPrefixer])
                .process(
                    await new Promise((res) =>
                        Stylus(original).render((err, css) => {
                            if (err) throw err
                            res(css)
                        })
                    ),
                    { from: undefined }
                )).css)
                .styles
        } catch (e) {
            ctx.fail(e)
            return
        }
        ctx.write(ctx.path.replace(/\.styl$/, '.css'), r)
    },
    async ctx => {
        if (!ctx.path.endsWith('.html')) return false
        if (ctx.dev) {
            const html = NodeHTMLParser.parse(await ctx.read())
            html.querySelector('head')?.insertAdjacentHTML?.(
                'beforebegin',
                `<script type="module">if(window.self===window.top){console.log('%cDeveloper Mode Auto-Refresh Activated!','font-size:16px;font-weight:bold;color:#0F8');let ws;function reconnect(){ws=new WebSocket(\`ws://\${location.hostname}:3000\`);ws.onmessage=()=>location.reload();ws.onclose=reconnect}addEventListener('error',e=>{if(ws?.readyState==1)ws.send(JSON.stringify({errorStack:e.error.stack,errorName:e.error.name,errorMessage:e.error.message,userAgent:navigator.userAgent}))});reconnect()}</script>\n`
            )
            ctx.write(ctx.path, html.toString())
        }
        else
            ctx.copy(ctx.path, ctx.path)
    },
    async ctx => {
        if (!(ctx.path.endsWith('.ts') || ctx.path.endsWith('.js') || ctx.path.endsWith('.mjs') || ctx.path.endsWith('.cjs'))) return false
        let r
        try {
            const options : SWC.Options = {
                jsc: {
                    loose: false,
                    parser: {
                        decorators: true,
                        syntax: 'typescript',
                        tsx: false,
                        comments: false
                    },
                    minify: {
                        compress: true,
                        mangle: true
                    }
                },
                module: { type: 'es6' },
                minify: true, // !ctx.dev Не работает замена импортов ебаных
                isModule: true,
                sourceMaps: ctx.dev,
            }
            const ast = await SWC.parseFile(file.path(ctx.src, ctx.path), options.jsc.parser)
            
            // for (let s of ast.body) {
            //     if (s.type !== 'ImportDeclaration' && s.type !== 'ExportAllDeclaration') continue
            //     // @author/rect
            //     // id
            //     // paths that touch outside of client and shared
            //     // бля ебаные папки
            //     if (/^\/|\.\/|\.\.\//.test(s.source.value) || /^file:\/\/\//.test(s.source.value)) {
            //         // только ./чёткий путь.расширение
            //         // потом exports
            //         // потом main

            //         // console.log(file.path(ctx.src, ctx.dir))
            //         let pth
            //         if (s.source.value[0] == '.')
            //             pth = file.path(ctx.dir, s.source.value)
            //         else
            //             pth = file.path(s.source.value)

            //         const isExternal = pth.startsWith('..')
            //         if (isExternal) {
            //             console.log('ExternalPath', s.source.value, pth)
            //             s.source.value = 'NIGGERKILLER'
            //             // подобрать имя
            //             // заменить штучку
            //         }
            //         // else {
            //         //     const [exists1, exists2] = await Promise.all([
            //         //         file.fileExists(file.path('client', pth)),
            //         //         file.fileExists(file.path('shared', pth))
            //         //     ])
            //         //
            //         //     if (!exists1 && !exists2) continue
            //         //     if (exists1 && exists2) return ctx.fail(`Ambiguous import: "${s.source.value}"`)
            //         //
            //         //     pth = exists1 ? file.path('client', pth) : file.path('shared', pth)
            //         //
            //         //     // console.log('path', s.source.value, pth)
            //         // }
            //     } else {
            //         const m = s.source.value.match(/^(?:(@[a-z]+)\/)?(.*)/)
            //         const namespace = m[1]
            //         const module = m[2]
            //         if (/^https?:\/\//.test(module)) continue
                    
            //         for (const [k, v] of Object.entries(deps)) {
            //             if (k.startsWith(s.source.value)) { // Блять а как оно подимпорты делать должно lox/xyu lox
            //                 // Цепочка рекурсивная

            //                 const pkg2 = JSON.parse(await ctx.read(file.path('../node_modules', k, 'package.json')))
            //                 // exports
            //                 // "browser"
            //                 console.log('nonpath', file.path('node_modules', k, pkg2.main))
            //                 break
            //             }
            //         }
                    
            //         // file: or node_modules
            //         // console.log('nonpath', namespace, module)
            //     }
            // }
            r = await SWC.transform(ast, options)
        } catch (e) {
            ctx.fail(e)
            return
        }
        const jsPath = ctx.path.replace(/\.ts$/, '.js')
        const mapPath = jsPath + '.map'
        let code = r.code
        if (ctx.dev) code +=`\n//# sourceMappingURL=${encodeURIComponent(file.name(mapPath))}`
        ctx.write(jsPath, code)
        if (ctx.dev) ctx.write(mapPath, r.map)
    },
    async ctx => {
        ctx.copy(ctx.path, ctx.path)
    }
]

let somethingChanged = false

const associatedFiles = SmartMap(file.normalize)
const errorActions = SmartMap(file.normalize)
const writeActions = SmartMap(file.normalize)
const copyActions = SmartSet(
    x => x.map(file.normalize).join('|'),
    x => x.split('|')
)
const filesToCleanUp = SmartSet(file.normalize)

const stuffMakers = new SmartSet

let compiledFirst = false
const initialFiles = new Set
const filesForInitialBuild = new Set
const buildTimeElapser = Elapser()
let didShit = false
async function watchDir(inputDir) {
    const fileList = await file.listFiles(inputDir)
    for (const f of fileList) {
        initialFiles.add(file.normalize(f))
        filesForInitialBuild.add(file.normalize(f))
    }

    const fileHandler = async (op, path) => {
        if (op == 'add' || op == 'change') {
            const localPath = Path.relative(inputDir, path)
            let errored = false
            const ctx = {
                dev: devMode,
                filename: Path.basename(path),
                dir: Path.dirname(localPath),
                path: localPath,
                src: inputDir,
                dst: file.normalize('build'),
                fail: (err) => {
                    errored = true
                    stuffMakers.add(() =>
                        errorActions.set(file.path(ctx.src, ctx.path), err)
                    )
                },
                read: async (path) => {
                    path ??= ctx.path
                    // TODO: кешировать файлы в рамках одной перекомпиляции
                    return await file.read(file.path(ctx.src, path))
                },
                write: (to, data) => {
                    to ??= ctx.path
                    const from = ctx.path
                    stuffMakers.add(() =>
                        writeActions.set(file.path(ctx.dst, to), [file.path(ctx.src, from), data])
                    )
                },
                copy: (from, to) => {
                    from ??= ctx.path
                    to ??= ctx.path
                    stuffMakers.add(() =>
                        copyActions.add([file.path(ctx.src, from), file.path(ctx.dst, to)])
                    )
                }
            }
            if (compiledFirst) console.log(`\x1b[2J\x1b[H\x1b[1;33mCompiling \x1b[;4;33m${localPath}\x1b[;33m...\x1b[;m`)
            for (const compiler of compilers) {
                if (!didShit) buildTimeElapser.start()
                const compiled = (await compiler(ctx)) !== false
                if (!compiled) continue
                if (!errored) errorActions.delete(file.path(ctx.src, ctx.path))
                didShit = true
                stuffMakers.add(() =>
                    filesForInitialBuild.delete(file.normalize(path))
                )
                somethingChanged = true
                break
            }
        }
        if (op == 'change') stuffMakers.add(() => filesToCleanUp.add(path))
        if (op == 'unlink') stuffMakers.add(() => filesToCleanUp.add(path))
    }

    const watcher = Chokidar.watch(inputDir, {  usePolling: true, interval: 250 }).on('all', fileHandler)
}

await watchDir('client')
await watchDir('shared')
console.log(`\x1b[2J\x1b[H\x1b[1;33mCompiling \x1b[;33m${initialFiles.size} files...\x1b[;m`)


function loxTime() {
    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    return currentTime
}

loop(async () => {
    const promises = new Set

    for (const sm of stuffMakers.clear()) sm()

    const written = new Set

    const copiedPaths = new Set
    for (const [from, to] of copyActions.clear())
        promises.add((async () => {
            if (await file.fileExists(from)) {
                await file.copy(from, to)
                written.add(to)
                if (compiledFirst) copiedPaths.add(from)
                associatedFiles.getOrSet(from, () => new SmartSet).add(to)
            }
        })())

    const compiledPaths = new Set
    for (const [to, [from, data]] of writeActions.clear())
        promises.add((async () => {
            if (await file.fileExists(from)) {
                await file.write(to, data)
                written.add(to)
                if (compiledFirst) compiledPaths.add(from)
                associatedFiles.getOrSet(from, () => new SmartSet).add(to)
            }
        })())

    await Promise.all(promises)

    for (const f of filesToCleanUp.clear()) {
        const afs = associatedFiles.get(f)
        if (!afs) continue
        for (const p of afs.clear())
            promises.add((async () => {
                if (written.has(p)) return
                if (!await file.fileExists(p)){
                    console.log(p)
                    return
                }
                await file.remove(p)
            })())
    }


    if (somethingChanged && filesForInitialBuild.size == 0) {
        let lines = []
        lines.push(`\x1b[2J\x1b[H\x1b[1;32mReady \x1b[;32min \x1b[;32m${buildTimeElapser.elapsed.toFixed(2)}\x1b[;32m sec \x1b[;32m(${loxTime()})\x1b[m`)
        
        
        compiledFirst = true
        
        const fileList = await file.listFiles('build')
        const indices = fileList.filter(x => file.name(x) == 'index.html').map(x => file.relative('build', file.dirname(x)).replace(/^\.\/?/, ''))
        indices.sort()
        let first = true
        for (const p of indices) {
            const url = 'http://127.0.0.1' + (p == '' ? '' : ('/' + p))
            lines.push(`\x1b[1;34m${first ? 'Serving: ' : '         '}\x1b[;4;34m${url}\x1b[m`)
            first = false
        }
        let daun = `\x1b[1;${errorActions.size == 0 ? '32' : '31'}mChanges: `
        let eblan = true
        let sublines = []
        let hlp = str => {
            if (eblan) {
                eblan = false
                daun += str
            }
            else
                sublines.push('         ' + str)
        }
        for (const [p, err] of errorActions)
            hlp(`\x1b[;31merror \x1b[4m${p}  ${err}\x1b[m`)
        for (const p of copiedPaths)
            hlp(`\x1b[;32mcopied \x1b[4m${p}\x1b[m`)
        for (const p of compiledPaths)
            hlp(`\x1b[;32mcompiled \x1b[4m${p}\x1b[m`)
        if (!eblan) lines.push(daun, ...sublines)
        somethingChanged = false
        wsBroadcast('')
        didShit = false
        console.log(lines.join('\n'))
    }

    await sleep(0.1)
})

function exit() {
    console.log(`\x1b[2J\x1b[H\x1b[1;32mGood luck!\x1b[;m`)
    const srcMsg = 'Good luck, coder!'
    let outMsg = '\x1b[2J\x1b[H\x1b[;1m'
    for (let i = 0; i < srcMsg.length; ++i)
        outMsg += `\x1b[38;2;${hsv2rgb((i / srcMsg.length) * 0.8, 0.43, 1).map(x=>floor(x*255)).join(';')}m` + srcMsg[i]
    outMsg += '\x1b[;m'
    Process.stdout.write(outMsg)
    Process.exit(0)
}
Process.on('SIGINT', () => exit())
Process.on('SIGQUIT', () => exit())
Process.on('SIGTERM', () => exit())

const app = Express()
app.use(Express.static('build'))
app.listen(80)