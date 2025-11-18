import type { ComponentType, ReactElement } from 'react'
import { useBannerVisibility } from '../../hooks/useBannerVisibility'
import { BannerType } from '../../hooks/useBannerStorage'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { SkeletonBanner } from '@/components/dashboard/NewsCarousel/SkeletonBanner'
import useDebounce from '@safe-global/utils/hooks/useDebounce'

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
      // Debounce loading to keep skeleton visible briefly after loading completes for smooth transition
      const debouncedLoading = useDebounce(loading, 50)

      // If still loading (or debouncing), show skeleton (only for Promo banner type in dashboard carousel)
      if (debouncedLoading && bannerType === BannerType.Promo) {
        return <SkeletonBanner />
      }

      // If loading for non-Promo banner, return null
      if (debouncedLoading) {
        return null
      }

      // If loading is done but banner shouldn't be shown, return null
      if (!showBanner) {
        return null
      }

      return <WrappedComponent {...props} />
    }
  }
}
