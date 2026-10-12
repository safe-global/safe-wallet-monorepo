import { useEffect, useRef, useState } from 'react'
import { release, retain, ThreadMessagePort } from '@quilted/threads'
import { RemoteReceiver, RemoteRootRenderer } from '@remote-dom/react/host'
import type { RemoteConnection } from '@remote-dom/core/elements'
import { REMOTE_COMPONENTS } from './components'

type RemoteProps = Record<string, unknown>
type WorkerApi = {
  render: (
    connection: RemoteConnection,
    name: string,
    props: RemoteProps,
  ) => Promise<{
    update: (props: RemoteProps) => Promise<void>
  }>
}

const FRAME_URL = '/remote-view/frame.html'

// Renders a view from @safe-global/views in a sandboxed worker. Only plain data and callbacks cross;
// the worker never sees this page, and the page only draws what REMOTE_COMPONENTS allows.
export const RemoteView = ({ name, props }: { name: string; props: RemoteProps }) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [receiver] = useState(() => new RemoteReceiver({ retain, release }))
  const viewRef = useRef<Promise<{ update: (props: RemoteProps) => Promise<void> }> | null>(null)
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const channel = new MessageChannel()

    const start = (event: MessageEvent) => {
      const target = frame.contentWindow
      if (!target || event.source !== target || event.data !== 'safe-remote-view-ready') return
      window.removeEventListener('message', start)
      target.postMessage('safe-remote-view', '*', [channel.port2])
      const api = ThreadMessagePort.import<WorkerApi>(channel.port1)
      channel.port1.start()
      viewRef.current = api.render(receiver.connection, name, propsRef.current)
    }
    window.addEventListener('message', start)

    return () => {
      window.removeEventListener('message', start)
      channel.port1.close()
      viewRef.current = null
    }
  }, [name, receiver])

  useEffect(() => {
    viewRef.current?.then((view) => view.update(props))
  }, [props])

  return (
    <div className="[contain:paint]">
      <iframe
        ref={frameRef}
        src={FRAME_URL}
        sandbox="allow-scripts"
        hidden
        className="hidden"
        title={`remote-view-${name}`}
      />
      <RemoteRootRenderer receiver={receiver} components={REMOTE_COMPONENTS} />
    </div>
  )
}
