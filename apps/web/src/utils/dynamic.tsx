import { type ComponentType, useEffect, useState } from 'react'
import { Errors, logError } from '@/services/exceptions'

type Loader<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>

// The next/dynamic call shape, so a file moves off Next by changing only its import path. Every component
// renders nothing on the server and until its chunk has loaded, so `ssr` changes nothing.
type Dynamic = <P extends object>(loader: Loader<P>, options?: { ssr?: boolean }) => ComponentType<P>

const RenderNothing = () => null

// No Suspense: React holds back a Suspense reveal by up to 300 ms, which delayed e.g. the wallet init.
const dynamic: Dynamic = <P extends object>(loader: Loader<P>) => {
  let loaded: ComponentType<P> | undefined
  let loading: Promise<ComponentType<P>> | undefined

  const load = () =>
    (loading ??= loader()
      .then((module) => ('default' in module ? module.default : module))
      // Like next/dynamic, a chunk that fails to load renders nothing instead of reaching the app's error boundary.
      .catch((error: unknown) => {
        logError(Errors._906, error)
        return RenderNothing as ComponentType<P>
      })
      .then((component) => (loaded = component)))

  const DynamicComponent = (props: P) => {
    // `loaded` is still unset on the server and during hydration, because only an effect starts the loader.
    const [Component, setComponent] = useState(() => loaded)

    useEffect(() => {
      if (Component) return
      let isMounted = true
      load().then((component) => {
        if (isMounted) setComponent(() => component)
      })
      return () => {
        isMounted = false
      }
    }, [Component])

    return Component ? <Component {...props} /> : null
  }

  return DynamicComponent
}

export default dynamic
