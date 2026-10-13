import { type ComponentType, lazy, Suspense, useEffect, useState } from 'react'

// Same call shape as next/dynamic, so a file moves off Next by changing only its import path.
const dynamic = <P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options: { ssr?: boolean } = {},
): ComponentType<P> => {
  const LazyComponent = lazy(loader)
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
