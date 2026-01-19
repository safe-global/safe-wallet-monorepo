import type { ComponentType, ReactElement } from 'react'
import { useIsHypernativeEligible } from '../../hooks/useIsHypernativeEligible'

/**
 * Higher-order component that checks if the current Safe is eligible for Hypernative CTAs
 * (guard enabled or outreach targeted). Returns null if not eligible or still loading.
 */
export function withHnEligibilityCheck<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithEligibilityCheckComponent(props: P): ReactElement | null {
    const { isHypernativeEligible, loading } = useIsHypernativeEligible()

    if (loading || !isHypernativeEligible) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
