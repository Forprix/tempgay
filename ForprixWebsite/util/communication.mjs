const queue = new Map
const handlers = new Map
addEventListener('message', async e => {
  if (e.source !== remoteTarget) return
  const msg = e.data
  if (msg[0]) {
    const v = queue.get(msg[1])
    if (v != null) queue.delete(msg[1]), (msg[2] ? v[1] : v[0])(msg[3])
    return
  }
  const handler = handlers.get(msg[1])
  let data, isError = true
  if (handler != null)
    try {
      data = await handler(msg[3])
      isError = false
    } catch (e) { data = e }
  else data = `Remote target doesn't support function "${msg[1]}"`
  e.source.postMessage([true, msg[2], isError, data])
})

let remoteTarget = top
export const setRemoteTarget = v => remoteTarget = v
export const send = (func, data, standaloneHandler) => {
  if (window === remoteTarget) return standaloneHandler(data)
  let id
  while (true) {
    id = Math.floor(9007199254740991 * Math.random())
    if (!queue.has(id)) break
  }
  const msg = [false, func, id, data]
  return new Promise((res, rej) => {
    queue.set(id, [res, rej])
    remoteTarget.postMessage(msg)
  })
}
export const setHandler = (func, cb) => {
  handlers.set(func, cb)
}