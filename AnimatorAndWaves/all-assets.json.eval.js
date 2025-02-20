import FileSystemAsync from 'node:fs/promises'
import Path from 'node:path'
import process from 'node:process'

async function walkDir(dir, cb) {
    const files = await FileSystemAsync.readdir(dir)
    const promises = []
    for (const file of files) {
        const fullPath = Path.join(dir, file)
        promises.push(FileSystemAsync.stat(fullPath).then(stat =>
            stat.isDirectory() ? walkDir(fullPath, cb) : cb(fullPath, stat)
        ))
    }
    await Promise.all(promises)
}

const assets = []
await walkDir('assets', (file) => {
    assets.push('/' + Path.relative('assets', file).replaceAll('\\', '/'))
})

process.stdout.write(JSON.stringify(assets))


// import io from '@forprix/util/io'
// import file from '@forprix/util/file'
//
// io.write(
//     JSON.stringify(
//         await file.listPaths('assets')
//     )
// )