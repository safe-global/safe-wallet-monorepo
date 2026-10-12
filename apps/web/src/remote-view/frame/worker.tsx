import '@remote-dom/core/polyfill'
import '@remote-dom/react/polyfill'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ThreadMessagePort } from '@quilted/threads'
import { BatchingRemoteConnection, RemoteRootElement, type RemoteConnection } from '@remote-dom/core/elements'
import { defineRemoteElements } from './elements'
import { REMOTE_VIEWS } from './views'

customElements.define('remote-root', RemoteRootElement)
defineRemoteElements()

const render = (connection: RemoteConnection, name: string, props: Record<string, unknown>) => {
  const View = REMOTE_VIEWS[name]
  if (!View) throw new Error(`Unknown remote view: ${name}`)

  const root = document.createElement('remote-root') as RemoteRootElement
  root.connect(new BatchingRemoteConnection(connection))
  document.body.append(root)

  const reactRoot = createRoot(root)
  reactRoot.render(createElement(View, props as never))
  return {
    update: (next: Record<string, unknown>) => reactRoot.render(createElement(View, next as never)),
  }
}

self.addEventListener(
  'message',
  (event: MessageEvent) => {
    const [port] = event.ports
    if (!port) return
    ThreadMessagePort.export(port, { render })
    port.start()
  },
  { once: true },
)
