import type { ComponentType } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import type { FEATURES } from '@safe-global/utils/utils/chains'
export { FEATURES } from '@safe-global/utils/utils/chains'
export const featureToggled = <P extends Record<string, unknown>>(Component: ComponentType<P>, feature: FEATURES) => {
  const ToggledComponent = (props: P) => {
    const hasFeature = useHasFeature(feature)
    return hasFeature ? <Component {...props} /> : null
  }
  ToggledComponent.displayName = Component.displayName || Component.name
  return ToggledComponent
}
