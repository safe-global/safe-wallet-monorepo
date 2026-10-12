import { useEffect, useRef, useState, type ReactNode } from 'react'
import { release, retain } from '@quilted/threads'
import { RemoteReceiver, RemoteRootRenderer } from '@remote-dom/react/host'
import { REMOTE_COMPONENTS } from './components'
import { getSandbox, type RemoteHandle, type RemoteProps } from './sandbox'
import { toRemoteProps } from './remoteProps'
import { PropUrlsContext, SlotContext, ViewTokenContext } from './slots'
import { cssMaps } from './css'

// Renders a view from @safe-global/views in the sandboxed worker. Only plain data and callbacks cross;
// React content from the app stays on the page in slots, and the page only draws what REMOTE_COMPONENTS allows.
export const RemoteView = ({ name, props }: { name: string; props: RemoteProps }) => {
  const [receiver] = useState(() => new RemoteReceiver({ retain, release }))
  const [token] = useState(() => ({}))
  const [stable] = useState(() => new Map<string, (...args: unknown[]) => unknown>())
  const callbacks = useRef(new Map<string, (...args: unknown[]) => unknown>())
  const handle = useRef<Promise<RemoteHandle> | null>(null)

  const slots = new Map<string, ReactNode>()
  const urls = new Set<string>()
  const nextCallbacks = new Map<string, (...args: unknown[]) => unknown>()
  const data = toRemoteProps(
    props,
    'props',
    slots,
    nextCallbacks,
    stable,
    (path) => callbacks.current.get(path),
    urls,
  ) as RemoteProps
  callbacks.current = nextCallbacks
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    const view = getSandbox().then((api) => api.render(receiver.connection, name, dataRef.current, cssMaps()))
    handle.current = view
    return () => {
      handle.current = null
      view.then((mounted) => mounted.unmount())
    }
  }, [name, receiver])

  useEffect(() => {
    handle.current?.then((view) => view.update(data))
  })

  return (
    <SlotContext.Provider value={slots}>
      <PropUrlsContext.Provider value={urls}>
        <ViewTokenContext.Provider value={token}>
          <RemoteRootRenderer receiver={receiver} components={REMOTE_COMPONENTS} />
        </ViewTokenContext.Provider>
      </PropUrlsContext.Provider>
    </SlotContext.Provider>
  )
}
