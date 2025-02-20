/**
 * @param {string | URL} scriptURL 
 * @param {WorkerOptions} [options]
*/
export function createWorker(scriptURL, options) {
    return new Promise((res, rej) => {
        function createHash() {
            return Array(16).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[Math.floor(Math.random() * 64)]).join('')
        }
        const worker = new Worker(scriptURL, options)
        const usedHashes = new Map()
        const onMessage = e => {
            if (e.data?.type != 'ready') return
            worker.removeEventListener('message', onMessage)
            worker.remote = (functionName, ...args) => 
                new Promise((res, rej) => {
                    let hash
                    do hash = createHash()
                    while (usedHashes.has(hash))
                    usedHashes.set(hash, { res, rej })
                    worker.postMessage({ type: 'remote-request', hash, functionName, args })
                })
            worker.addEventListener('message', e => {
                if (e.data?.type != 'remote-responce') return
                if (e.data.error)
                    usedHashes.get(e.data.hash).rej(e.data.error)
                else
                    usedHashes.get(e.data.hash).res(e.data.data)
                usedHashes.delete(e.data.hash)
            })
            res(worker)
        }
        worker.addEventListener('message', onMessage)
        worker.addEventListener('error', rej)
    })
}
export function initWorker(funcs = {}) {
    postMessage({ type: 'ready' })
    addEventListener('message', async e => {
        if (e.data?.type != 'remote-request') return
        const hash = e.data.hash
        try {
            console.log(e.data.functionName)
            const data = await funcs[e.data.functionName](...e.data.args)
            postMessage({ type: 'remote-responce', hash, data })
        } catch (error) {
            postMessage({ type: 'remote-responce', hash, error })
        }
    })
}
