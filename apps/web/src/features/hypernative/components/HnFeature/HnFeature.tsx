import type { ReactElement } from 'react'
import { useIsHypernativeFeature } from '../../hooks/useIsHypernativeFeature'
import { useBannerVisibility } from '../../hooks/useBannerVisibility'
import type { BannerType } from '../../hooks/useBannerStorage'

export interface HnFeatureProps {
  children: ReactElement
  bannerType: BannerType
}

/**
 * Conditional wrapper component that checks banner visibility.
 * Only renders children if banner should be shown based on all conditions.
 */
const HnConditional = ({ children, bannerType }: HnFeatureProps): ReactElement | null => {
  const { loading, showBanner } = useBannerVisibility(bannerType)

  if (loading || !showBanner) {
    return null
  }

  return <>{children}</>
}

/**
 * Wrapper component that conditionally renders children based on Hypernative feature flag and banner visibility.
 * First checks if Hypernative features are enabled globally, then checks if banner should be shown.
 * Only renders children if both conditions are met.
 */
const HnFeature = ({ children, bannerType }: HnFeatureProps): ReactElement | null => {
  const isEnabled = useIsHypernativeFeature()

  if (!isEnabled) {
    return null
  }

  return <HnConditional bannerType={bannerType}>{children}</HnConditional>
}

export default HnFeature
