import type { ComponentType, ReactElement } from 'react'
import { useIsHypernativeFeature } from '../../hooks/useIsHypernativeFeature'
import { useBannerVisibility } from '../../hooks/useBannerVisibility'
import type { BannerType } from '../../hooks/useBannerStorage'

export interface WithHnFeatureProps {
  isDismissable?: boolean
}

/**
 * Conditional wrapper component that checks banner visibility.
 * Only renders children if banner should be shown based on all conditions.
 */
const HnConditional = <P extends object>({
  bannerType,
  WrappedComponent,
  props,
}: {
  bannerType: BannerType
  WrappedComponent: ComponentType<P>
  props: P
}): ReactElement | null => {
  const { loading, showBanner } = useBannerVisibility(bannerType)

  if (loading || !showBanner) {
    return null
  }

  return <WrappedComponent {...props} />
}

/**
 * Higher-order component that wraps a component with Hypernative feature flag and banner visibility checks.
 * Only renders the wrapped component if:
 * 1. Hypernative features are enabled globally (checked first)
 * 2. Banner should be shown based on visibility conditions (lazy evaluation - only checked if #1 is true)
 *
 * @param bannerType - The type of banner to check visibility for
 */
export function withHnFeature<P extends WithHnFeatureProps = WithHnFeatureProps>(bannerType: BannerType) {
  return function (WrappedComponent: ComponentType<P>) {
    return function WithHnFeatureComponent(props: P): ReactElement | null {
      const isEnabled = useIsHypernativeFeature()

      if (!isEnabled) {
        return null
      }

      return <HnConditional bannerType={bannerType} WrappedComponent={WrappedComponent} props={props} />
    }
  }
}
