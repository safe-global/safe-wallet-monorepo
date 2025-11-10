import type { ReactElement } from 'react'
import { useIsHypernativeFeature } from '../../hooks/useIsHypernativeFeature'

export interface HnFeatureFlagProps {
  children: ReactElement
}

/**
 * Wrapper component that conditionally renders children based on Hypernative feature flag
 * Only renders children if Hypernative features are enabled
 */
export const HnFeatureFlag = ({ children }: HnFeatureFlagProps): ReactElement | null => {
  const isEnabled = useIsHypernativeFeature()

  if (!isEnabled) {
    return null
  }

  return children
}
