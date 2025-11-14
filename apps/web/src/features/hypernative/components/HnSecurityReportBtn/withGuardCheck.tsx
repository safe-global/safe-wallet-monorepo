import type { ComponentType, ReactElement } from 'react'
import { useIsHypernativeGuard } from '../../hooks/useIsHypernativeGuard'

/**
 * Higher-order component that checks if the current Safe has a Hypernative guard installed.
 * Returns null if the guard is not installed or still loading.
 */
export function withGuardCheck<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithGuardCheckComponent(props: P): ReactElement | null {
    const { isHypernativeGuard, loading } = useIsHypernativeGuard()

    if (loading || !isHypernativeGuard) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
