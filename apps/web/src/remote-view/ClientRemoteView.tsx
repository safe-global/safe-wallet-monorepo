import { lazy, Suspense, useEffect, useState } from 'react'
import type { RemoteProps } from './sandbox'

const LazyRemoteView = lazy(() => import('./RemoteView').then((module) => ({ default: module.RemoteView })))

// Sandboxed views only exist in the browser: nothing is rendered on the server or before hydration.
export const RemoteView = (props: { name: string; props: RemoteProps }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  if (!isClient) return null
  return (
    <Suspense fallback={null}>
      <LazyRemoteView {...props} />
    </Suspense>
  )
}
