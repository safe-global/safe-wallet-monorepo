import type { ComponentType } from 'react'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import dynamic from '@/utils/dynamic'

/**
 * Creates a public feature component: it renders nothing while the chain has the feature flag off, so the
 * component's chunk downloads only once it renders with the flag on.
 *
 * @param feature - The feature flag that gates the component.
 * @param loader - Imports the private component, for example `() => import('../components/RecoveryList')`.
 * @returns A component with the props of the loaded component.
 */
export function gatedDynamic<P extends object>(
  feature: FEATURES,
  loader: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> {
  const LazyComponent = dynamic(loader)

  const GatedComponent = (props: P) => (useHasFeature(feature) ? <LazyComponent {...props} /> : null)

  return GatedComponent
}
