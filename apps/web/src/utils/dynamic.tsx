import { type ComponentType, lazy, Suspense, useEffect, useState } from 'react'
import { Errors, logError } from '@/services/exceptions'

const RenderNothing = () => null

// Same call shape as next/dynamic, so a file moves off Next by changing only its import path.
const dynamic = <P extends object>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options: { ssr?: boolean } = {},
): ComponentType<P> => {
  const LazyComponent = lazy(() =>
    loader()
      .then((loaded) => ('default' in loaded ? loaded : { default: loaded }))
      // Like next/dynamic, a chunk that fails to load renders nothing instead of reaching the app's error boundary.
      .catch((error: unknown) => {
        logError(Errors._906, error)
        return { default: RenderNothing as ComponentType<P> }
      }),
  )
  const renderOnServer = options.ssr ?? true

  const DynamicComponent = (props: P) => {
    const [isMounted, setIsMounted] = useState(renderOnServer)
    useEffect(() => setIsMounted(true), [])

    if (!isMounted) return null

    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }

  return DynamicComponent
}

export default dynamic
