import { ThreadMessagePort } from '@quilted/threads'
import type { RemoteConnection } from '@remote-dom/core/elements'

export type RemoteProps = Record<string, unknown>
export type RemoteHandle = {
  update: (props: RemoteProps) => Promise<void>
  unmount: () => Promise<void>
}
type WorkerApi = {
  render: (
    connection: RemoteConnection,
    name: string,
    props: RemoteProps,
    css: Record<string, Record<string, string>>,
  ) => Promise<RemoteHandle>
}

const FRAME_URL = '/remote-view/frame.html'

let sandbox: Promise<WorkerApi> | undefined

// One sandboxed iframe and worker per page; every RemoteView renders its own root inside it.
export const getSandbox = (): Promise<WorkerApi> => {
  sandbox ??= new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.src = FRAME_URL
    frame.setAttribute('sandbox', 'allow-scripts')
    frame.hidden = true
    frame.className = 'hidden'
    frame.title = 'remote-views'
    const channel = new MessageChannel()

    const onReady = (event: MessageEvent) => {
      const target = frame.contentWindow
      if (!target || event.source !== target || event.data !== 'safe-remote-view-ready') return
      window.removeEventListener('message', onReady)
      target.postMessage('safe-remote-view', '*', [channel.port2])
      const api = ThreadMessagePort.import<WorkerApi>(channel.port1)
      channel.port1.start()
      // Not the proxy itself: resolving a promise with it would ask the worker for a `then` method.
      resolve({ render: (...args) => api.render(...args) })
    }
    window.addEventListener('message', onReady)
    document.body.append(frame)
  })
  return sandbox
}
