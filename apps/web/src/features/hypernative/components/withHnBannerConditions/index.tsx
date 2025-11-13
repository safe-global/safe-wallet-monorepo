import type { ComponentType, ReactElement } from 'react'
import { useBannerVisibility } from '../../hooks/useBannerVisibility'
import type { BannerType } from '../../hooks/useBannerStorage'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

export interface WithHnBannerConditionsProps {
  isDismissable?: boolean
  label?: HYPERNATIVE_SOURCE
}

/**
 * Higher-order component that checks banner visibility conditions.
 * Only renders the wrapped component if the banner should be shown based on visibility conditions
 * (e.g., user hasn't dismissed it, time-based conditions, etc.).
 *
 * This HoC should typically be composed with withHnFeature to also check the feature flag.
 *
 * @param bannerType - The type of banner to check visibility for
 */
export function withHnBannerConditions<P extends object = WithHnBannerConditionsProps>(bannerType: BannerType) {
  return function (WrappedComponent: ComponentType<P>) {
    return function WithHnBannerConditionsComponent(props: P): ReactElement | null {
      const { loading, showBanner } = useBannerVisibility(bannerType)

      if (loading || !showBanner) {
        return null
      }

      return <WrappedComponent {...props} />
    }
  }
}
