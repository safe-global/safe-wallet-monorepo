import type { ComponentType } from 'react'
import { HnFeatureFlag } from '../HnFeatureFlag'

export interface HnFeatureFlagWrapperProps<P = Record<string, unknown>> {
  component: ComponentType<P>
  componentProps: P
}

/**
 * Generic wrapper component that combines HnFeatureFlag with any child component
 * This allows importing only one component instead of two
 *
 * @example
 * <HnFeatureFlagWrapper
 *   component={HnBanner}
 *   componentProps={{ href: '/path', onDismiss: handleDismiss }}
 * />
 */
export const HnFeatureFlagWrapper = <P extends Record<string, unknown>>({
  component: Component,
  componentProps,
}: HnFeatureFlagWrapperProps<P>) => {
  return (
    <HnFeatureFlag>
      <Component {...componentProps} />
    </HnFeatureFlag>
  )
}
