import '@remote-dom/core/polyfill'
import '@remote-dom/react/polyfill'
import { createElement, type ComponentType, type ElementType } from 'react'
import { createRoot } from 'react-dom/client'
import { ThreadMessagePort } from '@quilted/threads'
import { BatchingRemoteConnection, RemoteRootElement, type RemoteConnection } from '@remote-dom/core/elements'
import { defineRemoteElements, Slot } from './elements'
import { REMOTE_VIEWS } from './views'
import { SLOT_KEY } from '../remoteProps'
import { setCssMaps } from './css'

customElements.define('remote-root', RemoteRootElement)
defineRemoteElements()

type Props = Record<string, unknown>

const isPlainObject = (value: unknown): value is Props =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

// Only plain data goes back to the page: events, DOM nodes and functions in callback arguments are dropped.
const toCloneable = (value: unknown): unknown => {
  if (value == null || typeof value !== 'object')
    return typeof value === 'function' || typeof value === 'symbol' ? undefined : value
  if (value instanceof Event || 'nativeEvent' in value || value instanceof Node) return undefined
  if (Array.isArray(value)) return value.map(toCloneable)
  if (!isPlainObject(value)) return undefined
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toCloneable(item)]))
}

type Callback = (...args: unknown[]) => unknown
type Callbacks = { latest: Map<string, Callback>; stable: Map<string, Callback> }

// Callbacks keep their identity across updates (one wrapper per prop path calling the latest function),
// so effects that depend on them do not run again on every render of the page.
const fromRemoteProps = (value: unknown, path: string, callbacks: Callbacks): unknown => {
  if (typeof value === 'function') {
    callbacks.latest.set(path, value as Callback)
    let stable = callbacks.stable.get(path)
    if (!stable) {
      stable = (...args: unknown[]) => callbacks.latest.get(path)?.(...args.map(toCloneable))
      callbacks.stable.set(path, stable)
    }
    return stable
  }
  if (Array.isArray(value)) return value.map((item, index) => fromRemoteProps(item, `${path}.${index}`, callbacks))
  if (!isPlainObject(value)) return value
  if (typeof value[SLOT_KEY] === 'string') return createElement(Slot as ElementType, { name: value[SLOT_KEY] })
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, fromRemoteProps(item, `${path}.${key}`, callbacks)]),
  )
}

const render = (
  connection: RemoteConnection,
  name: string,
  props: Props,
  css: Record<string, Record<string, string>>,
) => {
  setCssMaps(css)
  const View = REMOTE_VIEWS[name] as ComponentType<Props> | undefined
  if (!View) throw new Error(`Unknown remote view: ${name}`)

  const root = document.createElement('remote-root') as RemoteRootElement
  root.connect(new BatchingRemoteConnection(connection))
  document.body.append(root)

  const reactRoot = createRoot(root)
  const callbacks: Callbacks = { latest: new Map(), stable: new Map() }
  const draw = (next: Props) =>
    reactRoot.render(createElement(View, fromRemoteProps(next, 'props', callbacks) as Props))
  draw(props)
  return {
    update: draw,
    unmount: () => {
      reactRoot.unmount()
      root.remove()
    },
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
