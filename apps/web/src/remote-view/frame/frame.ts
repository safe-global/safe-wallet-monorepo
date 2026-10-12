declare const WORKER_SOURCE: string

// Runs inside the sandboxed iframe. The views run in a worker it starts, so they inherit the
// iframe's CSP (no network) and opaque origin (no storage) and cannot navigate anything.
let started = false
window.addEventListener('message', (event) => {
  const [port] = event.ports
  if (started || event.source !== window.parent || event.data !== 'safe-remote-view' || !port) return
  started = true
  const worker = new Worker(URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' })))
  worker.postMessage(null, [port])
})
window.parent.postMessage('safe-remote-view-ready', '*')
