import type { ComponentType, ReactElement } from 'react'
import { useIsHypernativeFeature } from '../../hooks/useIsHypernativeFeature'

/**
 * Higher-order component that checks if Hypernative features are enabled.
 * Only renders the wrapped component if the HYPERNATIVE feature flag is enabled on the current chain.
 *
 * This is a simple feature flag check that can be composed with other HoCs
 * (e.g., withHnBannerConditions, withGuardCheck) for more complex conditional rendering.
 */
export function withHnFeature<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithHnFeatureComponent(props: P): ReactElement | null {
    const isEnabled = useIsHypernativeFeature()

    if (!isEnabled) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
