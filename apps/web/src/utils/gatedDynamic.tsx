import type { ComponentType } from 'react'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import dynamic from '@/utils/dynamic'

// Renders nothing while the chain has the flag off, so the chunk downloads only when it renders with the flag on.
export function gatedDynamic<P extends object>(
  feature: FEATURES,
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
): ComponentType<P> {
  const LazyComponent = dynamic(loader)

  const GatedComponent = (props: P) => (useHasFeature(feature) ? <LazyComponent {...props} /> : null)

  return GatedComponent
}
