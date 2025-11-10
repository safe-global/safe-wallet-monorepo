import type { ReactElement } from 'react'
import { useIsHypernativeFeatureEnabled } from '../../hooks/useIsHypernativeFeatureEnabled'

export interface HnFeatureFlagProps {
  children: ReactElement
}

/**
 * Wrapper component that conditionally renders children based on Hypernative feature flag
 * Only renders children if Hypernative features are enabled
 */
export const HnFeatureFlag = ({ children }: HnFeatureFlagProps): ReactElement | null => {
  const isEnabled = useIsHypernativeFeatureEnabled()

  if (!isEnabled) {
    return null
  }

  return children
}
